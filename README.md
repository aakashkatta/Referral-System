# Referral Management System

A comprehensive referral management system built with React, featuring a financial ledger system and a rule-based flow builder.

## Features

### Part 1: Financial Ledger System
- **Immutable Ledger Entries**: All transactions are recorded immutably with timestamps
- **Credit, Debit, and Reversal Flows**: Complete support for all transaction types
- **Reward Lifecycle**: `pending` → `confirmed` → `paid` / `reversed`
- **Idempotent Reward Creation**: Prevents duplicate rewards using reference IDs
- **Audit-Friendly Structure**: Complete transaction history with metadata
- **User Balance Tracking**: Real-time balance calculation

### Part 2: Rule-Based Flow Builder
- **Visual Flow Builder**: Drag-and-drop interface for creating referral rules
- **Condition Nodes**: Define complex conditions (user properties, events, amounts)
- **Action Nodes**: Configure actions (rewards, notifications, emails, webhooks)
- **Rule Engine**: Evaluate and execute rules based on context
- **Rule Testing**: Test rules with sample contexts
- **Rule Management**: Save, load, and delete rules

## Tech Stack

- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **React Flow**: Visual flow builder for rules
- **Tailwind CSS**: Beautiful, responsive UI
- **Lucide React**: Modern icon library
- **Date-fns**: Date formatting utilities

## Getting Started

### Prerequisites

- Node.js 14+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── components/
│   ├── FinancialLedger.js    # Financial ledger UI component
│   └── FlowBuilder.js         # Rule flow builder UI component
├── models/
│   ├── ledger.js              # Ledger data models and service
│   └── rules.js                # Rule engine and data models
├── App.js                      # Main app with routing
├── main.jsx                    # React entry point
└── index.css                   # Global styles
```

## How Correctness is Ensured

### Financial Ledger

1. **Immutability**: Ledger entries are immutable - once created, they cannot be modified. Status updates create new entry instances.

2. **Idempotency**: Each reward creation requires a unique `referenceId`. If the same reference ID is used twice, the system returns the existing entry instead of creating a duplicate.

3. **State Transitions**: The reward lifecycle enforces valid state transitions:
   - `pending` → `confirmed` → `paid`
   - Any state → `reversed` (with reversal entry)

4. **Balance Calculation**: User balances are calculated by summing all non-reversed credits and subtracting debits/reversals, ensuring accurate accounting.

5. **Audit Trail**: Every entry includes:
   - Creation timestamp
   - Update timestamp
   - Reference ID for tracking
   - Metadata for additional context

### Reversals & Adjustments

1. **Reversal Process**:
   - Creates a new reversal entry linked to the original entry
   - Updates the original entry status to `reversed`
   - Maintains the audit trail by preserving original entries

2. **Balance Impact**: Reversals automatically adjust user balances by creating negative entries that offset the original credit.

3. **Metadata Tracking**: Reversal entries include:
   - Reference to original entry ID
   - Reason for reversal
   - Timestamp of reversal

## Data Model Choice

**In-Memory Storage (Current Implementation)**:
- Used for demonstration purposes
- Easy to understand and test
- Suitable for prototyping

**Production Recommendation**: 
- **SQL Database** (PostgreSQL recommended):
  - ACID compliance for financial transactions
  - Strong consistency guarantees
  - Excellent audit trail capabilities
  - Transaction support for complex operations
  - Relational integrity for user/entry relationships

**Schema Design** (for SQL):
```sql
CREATE TABLE ledger_entries (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- credit, debit, reversal
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR NOT NULL, -- pending, confirmed, paid, reversed
  reference_id VARCHAR UNIQUE NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_reference_id (reference_id),
  INDEX idx_status (status)
);
```

## What I Completed

✅ **Part 1 - Financial Ledger System**:
- Complete data model with immutable entries
- Credit, debit, and reversal flows
- Reward lifecycle implementation
- Idempotent reward creation
- Beautiful, modern UI
- User balance tracking
- Transaction history view

✅ **Part 2 - Rule-Based Flow Builder**:
- Rule representation format (JSON-based)
- Condition and action separation
- Visual flow UI with React Flow
- Drag-and-drop node connections
- Rule engine with evaluation logic
- Rule testing functionality
- Rule management (save/delete)

## What I Would Do Next

### Short-term Improvements:
1. **Persistence Layer**: Replace in-memory storage with a real database (PostgreSQL)
2. **API Backend**: Create RESTful API endpoints for ledger operations
3. **Authentication**: Add user authentication and authorization
4. **Real-time Updates**: WebSocket support for live balance updates
5. **Advanced Flow Builder**: 
   - Drag-and-drop node positioning
   - Nested conditions (AND/OR logic)
   - Conditional branching in flows
   - Flow templates

### Medium-term Enhancements:
1. **Natural Language to Rules** (Bonus Feature):
   - LLM integration (OpenAI/Anthropic API)
   - Convert text prompts to rule JSON
   - Auto-generate flow nodes from descriptions

2. **Advanced Analytics**:
   - Reward distribution charts
   - User activity dashboards
   - Rule performance metrics

3. **Webhook Integration**:
   - Real webhook execution for actions
   - Retry logic and error handling
   - Webhook event logging

4. **Testing**:
   - Unit tests for ledger service
   - Integration tests for rule engine
   - E2E tests for UI flows

### Long-term Features:
1. **Multi-currency Support**: Handle different currencies with conversion
2. **Scheduled Rules**: Time-based rule execution
3. **Rule Versioning**: Track rule changes over time
4. **A/B Testing**: Test different rule configurations
5. **Compliance**: GDPR, financial regulations compliance features

## Usage Examples

### Creating a Reward
1. Navigate to Financial Ledger
2. Click "Create Reward"
3. Enter amount, optional reference ID, and description
4. Submit to create a pending reward

### Confirming and Paying
1. Click "Confirm" on a pending reward
2. Click "Mark as Paid" on a confirmed reward
3. View updated balance

### Building a Rule
1. Navigate to Flow Builder
2. Click "Add Start" to add a start node
3. Click "Add Condition" to define conditions (e.g., userType = "paid")
4. Click "Add Action" to define actions (e.g., reward $500)
5. Connect nodes by dragging from one node to another
6. Click "Save Rule" to persist the rule

### Testing a Rule
1. Click "Test Rule" on any saved rule
2. System evaluates with sample context
3. View matched actions in alert

## Notes

- This is a frontend-only implementation for demonstration
- In production, all ledger operations should be handled server-side with proper validation
- The rule engine is simplified - production would need more robust evaluation
- UI is optimized for desktop but responsive for mobile

## License

This project is created for the take-home challenge.
