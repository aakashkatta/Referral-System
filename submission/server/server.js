const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Database connection
const dbPath = path.join(__dirname, 'database.sqlite')
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message)
  } else {
    console.log('Connected to SQLite database')
    db.run('PRAGMA foreign_keys = ON')
  }
})

// Helper function to promisify database queries
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err)
      else resolve({ lastID: this.lastID, changes: this.changes })
    })
  })
}

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

// ==================== LEDGER ENDPOINTS ====================

// Create a reward (idempotent)
app.post('/api/ledger/rewards', async (req, res) => {
  try {
    const { userId, amount, referenceId, description, metadata } = req.body

    if (!userId || !amount || !referenceId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if reference ID already exists (idempotency)
    const existing = await dbGet(
      'SELECT * FROM ledger_entries WHERE reference_id = ?',
      [referenceId]
    )

    if (existing) {
      return res.json({
        success: true,
        entry: existing,
        isDuplicate: true
      })
    }

    // Create new entry
    const id = `entry-${Date.now()}-${uuidv4().substring(0, 9)}`
    const entry = {
      id,
      user_id: userId,
      type: 'credit',
      amount: parseFloat(amount),
      currency: 'USD',
      status: 'pending',
      reference_id: referenceId,
      description: description || 'Referral reward',
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await dbRun(
      `INSERT INTO ledger_entries 
       (id, user_id, type, amount, currency, status, reference_id, description, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id, entry.user_id, entry.type, entry.amount, entry.currency,
        entry.status, entry.reference_id, entry.description, entry.metadata,
        entry.created_at, entry.updated_at
      ]
    )

    res.json({ success: true, entry, isDuplicate: false })
  } catch (error) {
    console.error('Error creating reward:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get all entries for a user
app.get('/api/ledger/users/:userId/entries', async (req, res) => {
  try {
    const { userId } = req.params
    const entries = await dbAll(
      'SELECT * FROM ledger_entries WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )

    // Parse metadata JSON
    const parsedEntries = entries.map(entry => ({
      ...entry,
      metadata: entry.metadata ? JSON.parse(entry.metadata) : {}
    }))

    res.json(parsedEntries)
  } catch (error) {
    console.error('Error fetching entries:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get user balance
app.get('/api/ledger/users/:userId/balance', async (req, res) => {
  try {
    const { userId } = req.params
    const entries = await dbAll(
      'SELECT * FROM ledger_entries WHERE user_id = ?',
      [userId]
    )

    const balance = entries
      .filter(e => e.status !== 'reversed')
      .reduce((sum, entry) => {
        if (entry.type === 'credit') return sum + parseFloat(entry.amount)
        if (entry.type === 'debit' || entry.type === 'reversal') return sum - parseFloat(entry.amount)
        return sum
      }, 0)

    res.json({ balance: parseFloat(balance.toFixed(2)) })
  } catch (error) {
    console.error('Error calculating balance:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update entry status
app.patch('/api/ledger/entries/:entryId/status', async (req, res) => {
  try {
    const { entryId } = req.params
    const { status } = req.body

    if (!['pending', 'confirmed', 'paid', 'reversed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const entry = await dbGet('SELECT * FROM ledger_entries WHERE id = ?', [entryId])
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' })
    }

    await dbRun(
      'UPDATE ledger_entries SET status = ?, updated_at = ? WHERE id = ?',
      [status, new Date().toISOString(), entryId]
    )

    const updated = await dbGet('SELECT * FROM ledger_entries WHERE id = ?', [entryId])
    res.json({ success: true, entry: updated })
  } catch (error) {
    console.error('Error updating status:', error)
    res.status(500).json({ error: error.message })
  }
})

// Reverse an entry
app.post('/api/ledger/entries/:entryId/reverse', async (req, res) => {
  try {
    const { entryId } = req.params
    const { reason } = req.body

    const entry = await dbGet('SELECT * FROM ledger_entries WHERE id = ?', [entryId])
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' })
    }

    if (entry.status === 'reversed') {
      return res.status(400).json({ error: 'Entry already reversed' })
    }

    // Update original entry
    await dbRun(
      'UPDATE ledger_entries SET status = ?, updated_at = ? WHERE id = ?',
      ['reversed', new Date().toISOString(), entryId]
    )

    // Create reversal entry
    const reversalId = `entry-${Date.now()}-${uuidv4().substring(0, 9)}`
    const reversalEntry = {
      id: reversalId,
      user_id: entry.user_id,
      type: 'reversal',
      amount: entry.amount,
      currency: entry.currency,
      status: 'reversed',
      reference_id: `reversal-${entry.id}`,
      description: `Reversal: ${entry.description}`,
      metadata: JSON.stringify({ originalEntryId: entry.id, reason: reason || 'No reason provided' }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await dbRun(
      `INSERT INTO ledger_entries 
       (id, user_id, type, amount, currency, status, reference_id, description, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reversalEntry.id, reversalEntry.user_id, reversalEntry.type, reversalEntry.amount,
        reversalEntry.currency, reversalEntry.status, reversalEntry.reference_id,
        reversalEntry.description, reversalEntry.metadata, reversalEntry.created_at, reversalEntry.updated_at
      ]
    )

    const updated = await dbGet('SELECT * FROM ledger_entries WHERE id = ?', [entryId])
    res.json({ success: true, entry: updated, reversalEntry })
  } catch (error) {
    console.error('Error reversing entry:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== RULES ENDPOINTS ====================

// Create a rule
app.post('/api/rules', async (req, res) => {
  try {
    const { name, conditions, actions, enabled } = req.body

    if (!name || !conditions || !actions || conditions.length === 0 || actions.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const ruleId = `rule-${Date.now()}-${uuidv4().substring(0, 9)}`
    const now = new Date().toISOString()

    // Insert rule
    await dbRun(
      'INSERT INTO rules (id, name, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [ruleId, name, enabled !== undefined ? enabled : 1, now, now]
    )

    // Insert conditions
    for (let i = 0; i < conditions.length; i++) {
      const cond = conditions[i]
      const condId = cond.id || `cond-${Date.now()}-${i}-${uuidv4().substring(0, 9)}`
      await dbRun(
        `INSERT INTO rule_conditions 
         (id, rule_id, type, field, operator, value, parent_id, condition_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          condId, ruleId, cond.type || 'custom', cond.field, cond.operator,
          cond.value || null, cond.parentId || null, i, now
        ]
      )
    }

    // Insert actions
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]
      const actionId = action.id || `action-${Date.now()}-${i}-${uuidv4().substring(0, 9)}`
      await dbRun(
        `INSERT INTO rule_actions 
         (id, rule_id, type, params, action_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          actionId, ruleId, action.type, JSON.stringify(action.params || {}), i, now
        ]
      )
    }

    const rule = await getRuleWithDetails(ruleId)
    res.json({ success: true, rule })
  } catch (error) {
    console.error('Error creating rule:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get all rules
app.get('/api/rules', async (req, res) => {
  try {
    const rules = await dbAll('SELECT * FROM rules ORDER BY created_at DESC')
    const rulesWithDetails = await Promise.all(
      rules.map(rule => getRuleWithDetails(rule.id))
    )
    res.json(rulesWithDetails)
  } catch (error) {
    console.error('Error fetching rules:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get a single rule
app.get('/api/rules/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params
    const rule = await getRuleWithDetails(ruleId)
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' })
    }
    res.json(rule)
  } catch (error) {
    console.error('Error fetching rule:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete a rule
app.delete('/api/rules/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params
    await dbRun('DELETE FROM rules WHERE id = ?', [ruleId])
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting rule:', error)
    res.status(500).json({ error: error.message })
  }
})

// Helper function to get rule with conditions and actions
async function getRuleWithDetails(ruleId) {
  const rule = await dbGet('SELECT * FROM rules WHERE id = ?', [ruleId])
  if (!rule) return null

  const conditions = await dbAll(
    'SELECT * FROM rule_conditions WHERE rule_id = ? ORDER BY condition_order',
    [ruleId]
  )

  const actions = await dbAll(
    'SELECT * FROM rule_actions WHERE rule_id = ? ORDER BY action_order',
    [ruleId]
  )

  return {
    ...rule,
    enabled: rule.enabled === 1,
    conditions: conditions.map(c => ({
      id: c.id,
      type: c.type,
      field: c.field,
      operator: c.operator,
      value: c.value,
      parentId: c.parent_id
    })),
    actions: actions.map(a => ({
      id: a.id,
      type: a.type,
      params: JSON.parse(a.params)
    }))
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message)
    } else {
      console.log('Database connection closed')
    }
    process.exit(0)
  })
})
