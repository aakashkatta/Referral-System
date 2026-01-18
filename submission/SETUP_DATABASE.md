# Database Setup Instructions

## Overview
The application now uses SQLite database for persistent storage. All data is stored in `server/database.sqlite`.

## Quick Start

### 1. Install Backend Dependencies
```bash
cd server
npm install
```

### 2. Initialize Database
```bash
npm run init-db
```
This creates the database file and all required tables.

### 3. Start Backend Server
```bash
npm start
```
Server runs on `http://localhost:3001`

### 4. Start Frontend (in a new terminal)
```bash
cd ..  # Go back to root
npm start
```
Frontend runs on `http://localhost:3000`

## Alternative: Run Both Together

From the root directory:
```bash
# Install concurrently if not already installed
npm install

# Run both frontend and backend
npm run dev
```

## Database Schema

The database includes 4 tables:
1. **ledger_entries** - Financial transactions
2. **rules** - Rule definitions
3. **rule_conditions** - Rule conditions (IF statements)
4. **rule_actions** - Rule actions (THEN statements)

See `DATABASE_SCHEMA.md` for detailed schema.

## API Endpoints

### Ledger Endpoints
- `POST /api/ledger/rewards` - Create a reward
- `GET /api/ledger/users/:userId/entries` - Get user entries
- `GET /api/ledger/users/:userId/balance` - Get user balance
- `PATCH /api/ledger/entries/:entryId/status` - Update entry status
- `POST /api/ledger/entries/:entryId/reverse` - Reverse an entry

### Rules Endpoints
- `POST /api/rules` - Create a rule
- `GET /api/rules` - Get all rules
- `GET /api/rules/:ruleId` - Get a single rule
- `DELETE /api/rules/:ruleId` - Delete a rule

### Health Check
- `GET /api/health` - Server health check

## Data Persistence

- All ledger entries are persisted to database
- All rules are persisted to database
- Data survives server restarts
- Database file: `server/database.sqlite`

## Resetting Database

To start fresh:
```bash
cd server
rm database.sqlite
npm run init-db
```

## Troubleshooting

**Database not found error:**
- Run `npm run init-db` in the server directory

**Port already in use:**
- Change PORT in `server/server.js` or set `PORT` environment variable

**CORS errors:**
- Make sure backend is running on port 3001
- Check `REACT_APP_API_URL` in frontend if using custom URL

## Production Notes

For production:
- Consider migrating to PostgreSQL
- Add authentication/authorization
- Add rate limiting
- Add database backups
- Use environment variables for configuration
