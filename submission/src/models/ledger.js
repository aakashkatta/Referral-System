// Financial Ledger Data Models
// Using in-memory storage for demo (would be replaced with database in production)

export const LedgerEntryType = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  REVERSAL: 'reversal'
}

export const RewardStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PAID: 'paid',
  REVERSED: 'reversed'
}

// Immutable ledger entry
export class LedgerEntry {
  constructor({
    id,
    userId,
    type,
    amount,
    currency = 'USD',
    status,
    referenceId, // For idempotency
    description,
    metadata = {},
    createdAt,
    updatedAt
  }) {
    this.id = id
    this.userId = userId
    this.type = type // credit, debit, reversal
    this.amount = amount
    this.currency = currency
    this.status = status // pending, confirmed, paid, reversed
    this.referenceId = referenceId // Unique reference for idempotency
    this.description = description
    this.metadata = metadata
    this.createdAt = createdAt || new Date().toISOString()
    this.updatedAt = updatedAt || new Date().toISOString()
  }

  // Immutable update - returns new instance
  updateStatus(newStatus) {
    return new LedgerEntry({
      ...this,
      status: newStatus,
      updatedAt: new Date().toISOString()
    })
  }
}

// Ledger Service - handles business logic
export class LedgerService {
  constructor() {
    this.entries = []
    this.referenceIds = new Set() // Track for idempotency
  }

  // Idempotent reward creation
  createReward({ userId, amount, referenceId, description, metadata }) {
    // Check idempotency
    if (this.referenceIds.has(referenceId)) {
      const existing = this.entries.find(e => e.referenceId === referenceId)
      return { success: true, entry: existing, isDuplicate: true }
    }

    // Create new reward entry
    const entry = new LedgerEntry({
      id: this.generateId(),
      userId,
      type: LedgerEntryType.CREDIT,
      amount,
      status: RewardStatus.PENDING,
      referenceId,
      description,
      metadata
    })

    this.entries.push(entry)
    this.referenceIds.add(referenceId)

    return { success: true, entry, isDuplicate: false }
  }

  // Confirm a pending reward
  confirmReward(entryId) {
    const entry = this.entries.find(e => e.id === entryId)
    if (!entry) {
      return { success: false, error: 'Entry not found' }
    }
    if (entry.status !== RewardStatus.PENDING) {
      return { success: false, error: 'Only pending rewards can be confirmed' }
    }

    const updated = entry.updateStatus(RewardStatus.CONFIRMED)
    this.updateEntry(entryId, updated)
    return { success: true, entry: updated }
  }

  // Mark reward as paid
  markAsPaid(entryId) {
    const entry = this.entries.find(e => e.id === entryId)
    if (!entry) {
      return { success: false, error: 'Entry not found' }
    }
    if (entry.status !== RewardStatus.CONFIRMED) {
      return { success: false, error: 'Only confirmed rewards can be paid' }
    }

    const updated = entry.updateStatus(RewardStatus.PAID)
    this.updateEntry(entryId, updated)
    return { success: true, entry: updated }
  }

  // Reverse a reward
  reverseReward(entryId, reason) {
    const entry = this.entries.find(e => e.id === entryId)
    if (!entry) {
      return { success: false, error: 'Entry not found' }
    }
    if (entry.status === RewardStatus.REVERSED) {
      return { success: false, error: 'Entry already reversed' }
    }

    // Create reversal entry
    const reversalEntry = new LedgerEntry({
      id: this.generateId(),
      userId: entry.userId,
      type: LedgerEntryType.REVERSAL,
      amount: entry.amount,
      status: RewardStatus.REVERSED,
      referenceId: `reversal-${entry.id}`,
      description: `Reversal: ${entry.description}`,
      metadata: { originalEntryId: entry.id, reason }
    })

    // Update original entry status
    const updated = entry.updateStatus(RewardStatus.REVERSED)
    this.updateEntry(entryId, updated)
    this.entries.push(reversalEntry)

    return { success: true, entry: updated, reversalEntry }
  }

  // Get user balance
  getUserBalance(userId) {
    return this.entries
      .filter(e => e.userId === userId && e.status !== RewardStatus.REVERSED)
      .reduce((balance, entry) => {
        if (entry.type === LedgerEntryType.CREDIT) {
          return balance + entry.amount
        } else if (entry.type === LedgerEntryType.DEBIT || entry.type === LedgerEntryType.REVERSAL) {
          return balance - entry.amount
        }
        return balance
      }, 0)
  }

  // Get all entries for a user
  getUserEntries(userId) {
    return this.entries
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  // Get all entries
  getAllEntries() {
    return [...this.entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  // Helper methods
  updateEntry(entryId, updatedEntry) {
    const index = this.entries.findIndex(e => e.id === entryId)
    if (index !== -1) {
      this.entries[index] = updatedEntry
    }
  }

  generateId() {
    return `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Singleton instance
export const ledgerService = new LedgerService()
