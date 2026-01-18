const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, 'database.sqlite')

// Remove existing database if it exists (for fresh start)
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath)
  console.log('Removed existing database')
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message)
    process.exit(1)
  }
  console.log('Connected to SQLite database')
})

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON')

// Create ledger_entries table
db.run(`
  CREATE TABLE ledger_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('credit', 'debit', 'reversal')),
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'paid', 'reversed')),
    reference_id TEXT UNIQUE NOT NULL,
    description TEXT,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('Error creating ledger_entries table:', err.message)
  } else {
    console.log('✓ Created ledger_entries table')
  }
})

// Create indexes for ledger_entries
db.run('CREATE INDEX idx_ledger_user_id ON ledger_entries(user_id)', (err) => {
  if (err) console.error('Error creating index:', err.message)
})
db.run('CREATE INDEX idx_ledger_reference_id ON ledger_entries(reference_id)', (err) => {
  if (err) console.error('Error creating index:', err.message)
})
db.run('CREATE INDEX idx_ledger_status ON ledger_entries(status)', (err) => {
  if (err) console.error('Error creating index:', err.message)
})

// Create rules table
db.run(`
  CREATE TABLE rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('Error creating rules table:', err.message)
  } else {
    console.log('✓ Created rules table')
  }
})

// Create rule_conditions table
db.run(`
  CREATE TABLE rule_conditions (
    id TEXT PRIMARY KEY,
    rule_id TEXT NOT NULL,
    type TEXT NOT NULL,
    field TEXT NOT NULL,
    operator TEXT NOT NULL CHECK(operator IN ('equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'and', 'or')),
    value TEXT,
    parent_id TEXT,
    condition_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES rule_conditions(id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) {
    console.error('Error creating rule_conditions table:', err.message)
  } else {
    console.log('✓ Created rule_conditions table')
  }
})

// Create rule_actions table
db.run(`
  CREATE TABLE rule_actions (
    id TEXT PRIMARY KEY,
    rule_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('reward', 'notification', 'email', 'webhook', 'custom')),
    params TEXT NOT NULL,
    action_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) {
    console.error('Error creating rule_actions table:', err.message)
  } else {
    console.log('✓ Created rule_actions table')
  }
})

// Create indexes
db.run('CREATE INDEX idx_conditions_rule_id ON rule_conditions(rule_id)', (err) => {
  if (err) console.error('Error creating index:', err.message)
})
db.run('CREATE INDEX idx_actions_rule_id ON rule_actions(rule_id)', (err) => {
  if (err) console.error('Error creating index:', err.message)
})

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message)
  } else {
    console.log('✓ Database initialized successfully!')
    console.log('Database file:', dbPath)
  }
})
