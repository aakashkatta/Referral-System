# How to Use the Referral Management System

## 🚀 Quick Start

### Step 1: Install Dependencies

Open your terminal in the project folder and run:

```bash
npm install
```

This will install all required packages (React, React Router, React Flow, Tailwind CSS, etc.)

### Step 2: Start the Application

```bash
npm start
```

This will:
- Start the development server
- Automatically open your browser to `http://localhost:3000`
- Enable hot-reloading (changes update automatically)

### Step 3: Use the Application

You'll see a beautiful interface with two main sections accessible via the top navigation bar.

---

## 📊 Part 1: Financial Ledger System

### Overview
The Financial Ledger allows you to manage referral rewards with a complete audit trail.

### How to Use:

#### 1. **Select a User**
- At the top of the Financial Ledger page, use the dropdown to select a user (User 1, User 2, or User 3)
- Each user has their own separate ledger and balance

#### 2. **Create a Reward**
- Click the **"Create Reward"** button (purple gradient button)
- Fill in the form:
  - **Amount**: Enter the reward amount (e.g., 500.00)
  - **Reference ID**: Optional - a unique identifier to prevent duplicates. If you leave it empty, one will be auto-generated.
  - **Description**: Describe the reward (e.g., "Referral reward for user subscription")
- Click **"Create Reward"**
- The reward will appear in the ledger with status **"pending"**

#### 3. **Reward Lifecycle - Confirm a Reward**
- Find a reward with status **"pending"**
- Click the **"Confirm"** button (blue button)
- The status changes to **"confirmed"**

#### 4. **Mark as Paid**
- Find a **"confirmed"** reward
- Click the **"Mark as Paid"** button (green button)
- The status changes to **"paid"**
- The balance updates automatically

#### 5. **Reverse a Reward**
- Find any reward that is not already reversed
- Click the **"Reverse"** button (red button)
- Enter a reason for the reversal when prompted
- A reversal entry is created and linked to the original reward
- The balance is adjusted automatically

#### 6. **View Balance**
- The current balance is displayed at the top right of the Financial Ledger page
- It updates automatically as you create, confirm, pay, or reverse rewards

#### 7. **Test Idempotency**
- Try creating a reward with the same Reference ID twice
- The system will return the existing reward instead of creating a duplicate
- This prevents accidental duplicate payments

### Example Workflow:
1. Create reward: $500 for "User 1 subscribes"
2. Confirm the reward
3. Mark as paid
4. Balance shows $500
5. If needed, reverse with reason "User cancelled"

---

## 🔄 Part 2: Rule-Based Flow Builder

### Overview
The Flow Builder lets you create visual rules that define when and how to reward users.

### How to Use:

#### 1. **Add Nodes to the Canvas**

**Add Start Node:**
- Click **"Add Start"** button
- A purple "Start" node appears on the canvas

**Add Condition Node:**
- Click **"Add Condition"** button
- A modal appears
- Fill in:
  - **Field**: Choose what to check (User Type, Event Type, Amount)
  - **Operator**: Choose comparison (Equals, Not Equals, Greater Than, etc.)
  - **Value**: Enter the value to compare against (e.g., "paid" for user type)
- Click **"Add Condition"**
- A blue "IF" node appears on the canvas

**Add Action Node:**
- Click **"Add Action"** button
- A modal appears
- Fill in:
  - **Action Type**: Choose (Reward, Notification, Email, Webhook)
  - **Amount**: If Reward type, enter the amount (e.g., 500)
  - **Description**: Enter description (e.g., "Referral reward")
- Click **"Add Action"**
- A green "THEN" node appears on the canvas

#### 2. **Connect Nodes**
- Click and drag from the edge of one node to another
- This creates a connection showing the flow
- Example: Start → Condition → Action

#### 3. **Move Nodes**
- Click and drag nodes to reposition them
- The canvas supports panning and zooming

#### 4. **Save a Rule**
- Build your flow with Start, Condition(s), and Action(s)
- Click **"Save Rule"** button (top right)
- Enter a rule name (e.g., "Paid User Referral Reward")
- Click **"Save"**
- The rule appears in the "Saved Rules" sidebar on the right

#### 5. **Test a Rule**
- Find a saved rule in the sidebar
- Click **"Test Rule"** button
- The system evaluates the rule with sample context:
  - userType: "paid"
  - eventType: "subscription"
  - amount: 100
- You'll see an alert showing if the rule matched and what actions would execute

#### 6. **Delete a Rule**
- Find a saved rule in the sidebar
- Click the trash icon (🗑️) next to the rule name
- Confirm deletion

#### 7. **Clear Canvas**
- Click **"Clear"** button to remove all nodes and start fresh

### Example Rule Creation:
1. **Add Start** node
2. **Add Condition**: 
   - Field: "User Type"
   - Operator: "Equals"
   - Value: "paid"
3. **Add Action**:
   - Type: "Reward"
   - Amount: "500"
   - Description: "Referral reward"
4. **Connect**: Start → Condition → Action
5. **Save Rule**: Name it "Paid User Referral Reward"
6. **Test Rule**: See if it matches the test context

---

## 🎨 Interface Features

### Navigation
- **Top Bar**: Switch between "Financial Ledger" and "Flow Builder"
- Active page is highlighted in white

### Visual Design
- **Gradient Backgrounds**: Purple/indigo gradients for a modern look
- **Card Layouts**: Clean white cards with shadows
- **Color Coding**:
  - 🟣 Purple: Start nodes, primary actions
  - 🔵 Blue: Condition nodes
  - 🟢 Green: Action nodes, paid status
  - 🟡 Yellow: Pending status
  - 🔴 Red: Reversed status, delete actions

### Responsive Design
- Works on desktop, tablet, and mobile
- Canvas can be panned and zoomed
- All modals are mobile-friendly

---

## 💡 Tips & Best Practices

### Financial Ledger:
1. **Always use Reference IDs** for important rewards to prevent duplicates
2. **Check balance** before confirming large rewards
3. **Document reversals** with clear reasons
4. **Review ledger entries** regularly for audit purposes

### Flow Builder:
1. **Start simple**: Create basic rules first, then add complexity
2. **Test rules** before deploying to production
3. **Name rules clearly** for easy identification
4. **Use multiple conditions** for complex logic (add multiple condition nodes)

---

## 🔧 Troubleshooting

### If the app won't start:
1. Make sure Node.js is installed: `node --version` (should be 14+)
2. Delete `node_modules` folder and `package-lock.json`
3. Run `npm install` again
4. Run `npm start`

### If styles look broken:
1. Make sure Tailwind CSS is properly configured
2. Check that `postcss.config.js` exists
3. Restart the dev server

### If React Flow doesn't work:
1. Check browser console for errors
2. Make sure you're using a modern browser (Chrome, Firefox, Safari, Edge)
3. Try clearing browser cache

---

## 📝 Data Storage

**Important Note**: This is a frontend-only demo. All data is stored in memory and will be lost when you refresh the page.

For production use, you would:
- Connect to a backend API
- Use a database (PostgreSQL recommended)
- Implement proper authentication
- Add data persistence

---

## 🎯 Next Steps

After getting familiar with the system:

1. **Explore the code**: Check `src/models/ledger.js` and `src/models/rules.js` to understand the logic
2. **Customize**: Modify colors, add new condition types, or extend actions
3. **Build backend**: Create API endpoints to persist data
4. **Add features**: Implement the bonus features mentioned in the README

---

## ❓ Common Questions

**Q: Can I have multiple conditions in one rule?**  
A: Yes! Add multiple condition nodes and connect them. The rule engine evaluates all conditions.

**Q: What happens if I refresh the page?**  
A: All data is lost (it's in-memory). In production, this would be saved to a database.

**Q: Can I edit a saved rule?**  
A: Currently, you need to delete and recreate. Future versions could include editing.

**Q: How do I test with different contexts?**  
A: The test uses a fixed context. You could modify the test function in `FlowBuilder.js` to use custom contexts.

---

Enjoy using the Referral Management System! 🎉
