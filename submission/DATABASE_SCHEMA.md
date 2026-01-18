# Database Schema Design

## Overview
This document describes the database schema for the Referral Management System using SQLite.

## Database Choice: SQLite
- **Why SQLite?**: 
  - ACID compliant for financial transactions
  - No separate server needed (file-based)
  - Perfect for development and small-medium deployments
  - Easy to migrate to PostgreSQL later if needed

## Tables

### 1. `ledger_entries` - Financial Transactions

Stores all ledger entries (credits, debits, reversals) with immutable audit trail.

```sql
CREATE TABLE ledger_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('credit', 'debit', 'reversal')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'paid', 'reversed')),
  reference_id TEXT UNIQUE NOT NULL,  -- For idempotency
  description TEXT,
  metadata TEXT,  -- JSON string
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledger_user_id ON ledger_entries(user_id);
CREATE INDEX idx_ledger_reference_id ON ledger_entries(reference_id);
CREATE INDEX idx_ledger_status ON ledger_entries(status);
CREATE INDEX idx_ledger_created_at ON ledger_entries(created_at);
```

**Fields Explanation:**
- `id`: Unique identifier (UUID)
- `user_id`: User who owns this entry
- `type`: Transaction type (credit/debit/reversal)
- `amount`: Transaction amount
- `currency`: Currency code (default USD)
- `status`: Lifecycle status (pending → confirmed → paid / reversed)
- `reference_id`: Unique reference for idempotency (prevents duplicates)
- `description`: Human-readable description
- `metadata`: JSON string for additional data (e.g., reversal reason)
- `created_at`: Entry creation timestamp
- `updated_at`: Last update timestamp

---

### 2. `rules` - Rule Definitions

Stores rule definitions (the main rule container).

```sql
CREATE TABLE rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,  -- 1 = true, 0 = false
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rules_enabled ON rules(enabled);
```

**Fields Explanation:**
- `id`: Unique rule identifier (UUID)
- `name`: Human-readable rule name
- `enabled`: Whether rule is active (1) or disabled (0)
- `created_at`: Rule creation timestamp
- `updated_at`: Last update timestamp

---

### 3. `rule_conditions` - Rule Conditions

Stores conditions for each rule (IF statements).

```sql
CREATE TABLE rule_conditions (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL,
  type TEXT NOT NULL,
  field TEXT NOT NULL,
  operator TEXT NOT NULL CHECK(operator IN ('equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'and', 'or')),
  value TEXT,
  parent_id TEXT,  -- For nested conditions (AND/OR)
  condition_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES rule_conditions(id) ON DELETE CASCADE
);

CREATE INDEX idx_conditions_rule_id ON rule_conditions(rule_id);
CREATE INDEX idx_conditions_parent_id ON rule_conditions(parent_id);
```

**Fields Explanation:**
- `id`: Unique condition identifier (UUID)
- `rule_id`: Reference to parent rule
- `type`: Condition type (user_property, event_type, amount, etc.)
- `field`: Field name to check (e.g., "userType", "amount")
- `operator`: Comparison operator (equals, greater_than, etc.)
- `value`: Value to compare against
- `parent_id`: For nested conditions (AND/OR logic)
- `condition_order`: Order of conditions within rule

---

### 4. `rule_actions` - Rule Actions

Stores actions for each rule (THEN statements).

```sql
CREATE TABLE rule_actions (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('reward', 'notification', 'email', 'webhook', 'custom')),
  params TEXT NOT NULL,  -- JSON string
  action_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE
);

CREATE INDEX idx_actions_rule_id ON rule_actions(rule_id);
```

**Fields Explanation:**
- `id`: Unique action identifier (UUID)
- `rule_id`: Reference to parent rule
- `type`: Action type (reward, notification, email, etc.)
- `params`: JSON string with action parameters (e.g., `{"amount": 500, "description": "Reward"}`)
- `action_order`: Order of actions within rule

---

## Data Relationships

```
rules (1) ──→ (many) rule_conditions
rules (1) ──→ (many) rule_actions
rule_conditions (1) ──→ (many) rule_conditions (nested conditions)
```

## Example Data

### Ledger Entry Example:
```json
{
  "id": "entry-123",
  "user_id": "user-1",
  "type": "credit",
  "amount": 500.00,
  "currency": "USD",
  "status": "pending",
  "reference_id": "ref-abc-123",
  "description": "Referral reward",
  "metadata": "{\"referrerId\": \"user-2\"}",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Rule Example:
```json
{
  "id": "rule-456",
  "name": "Paid User Referral Reward",
  "enabled": 1,
  "conditions": [
    {
      "id": "cond-1",
      "field": "userType",
      "operator": "equals",
      "value": "paid"
    },
    {
      "id": "cond-2",
      "field": "amount",
      "operator": "greater_than",
      "value": "200"
    }
  ],
  "actions": [
    {
      "id": "action-1",
      "type": "reward",
      "params": "{\"amount\": 500, \"description\": \"Referral reward\"}"
    }
  ]
}
```

## Key Design Decisions

1. **Immutability**: Ledger entries are never deleted, only status changes
2. **Idempotency**: `reference_id` UNIQUE constraint prevents duplicate rewards
3. **Audit Trail**: All entries have `created_at` and `updated_at` timestamps
4. **JSON Storage**: Metadata and params stored as JSON strings (SQLite doesn't have native JSON type)
5. **Cascading Deletes**: Deleting a rule automatically deletes its conditions and actions
6. **Indexes**: Added on frequently queried fields for performance

## Migration Path

If moving to PostgreSQL later:
- Change `TEXT` to `VARCHAR` or `UUID` type
- Use native `JSONB` type instead of `TEXT` for JSON fields
- Add more advanced constraints and triggers
- Consider partitioning for large-scale deployments
