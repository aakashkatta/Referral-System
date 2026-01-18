# How to Connect Nodes in the Flow Builder

## 🎯 Quick Guide

Connecting nodes in the Flow Builder is simple! Here's how:

## Step-by-Step Instructions

### 1. **Add Your Nodes First**
   - Click **"Add Start"** to add a Start node (purple)
   - Click **"Add Condition"** to add an IF node (blue)
   - Click **"Add Action"** to add a THEN node (green)

### 2. **Look for Connection Handles**
   Each node now has small circular handles:
   - **Start node**: Has a handle on the **right side** (output)
   - **Condition node**: Has handles on **left** (input) and **right** (output)
   - **Action node**: Has a handle on the **left side** (input)

### 3. **Connect the Nodes**
   
   **Method 1: Drag from Handle to Handle** (Recommended)
   1. Hover over the **right handle** of the Start node
   2. Click and **hold** the mouse button
   3. **Drag** to the **left handle** of the Condition node
   4. **Release** the mouse button
   5. A connection line with an arrow will appear! ✅

   **Method 2: Drag from Node Edge**
   1. Click and hold on the **right edge** of a node
   2. Drag to the **left edge** of another node
   3. Release to create the connection

### 4. **Complete Your Flow**
   - **Start** → **Condition** → **Action**
   - Connect: Start (right) → Condition (left)
   - Connect: Condition (right) → Action (left)

## Visual Example

```
[Start] ──→ [IF Condition] ──→ [THEN Action]
  │              │                  │
  └─ Handle      ├─ Handle          └─ Handle
     (output)    │  (input/output)      (input)
                 └─ Handle
                    (output)
```

## 💡 Tips

1. **Hover to See Handles**: When you hover over a node, the connection handles become more visible
2. **Connection Points**: 
   - Handles on the **right** = Output (connects TO other nodes)
   - Handles on the **left** = Input (receives connections FROM other nodes)
3. **Multiple Connections**: You can connect one node to multiple nodes
4. **Delete Connections**: Click on a connection line and press Delete key, or use the edge controls
5. **Visual Feedback**: When dragging, you'll see a connection line preview

## Common Flow Patterns

### Simple Rule:
```
Start → IF (userType = "paid") → THEN (reward $500)
```

### Multiple Conditions:
```
Start → IF (userType = "paid") → IF (amount > 200) → THEN (reward $500)
```

### Multiple Actions:
```
Start → IF (userType = "paid") → THEN (reward $500)
                                    ↓
                              THEN (send email)
```

## Troubleshooting

**Q: I don't see the handles**
- Make sure you've added nodes to the canvas
- Try hovering over the edges of the nodes
- Handles appear as small circles on the node edges

**Q: The connection won't connect**
- Make sure you're dragging from an output handle (right side) to an input handle (left side)
- Try zooming in for better precision
- Make sure both nodes are visible on the canvas

**Q: How do I delete a connection?**
- Click on the connection line (it will highlight)
- Press the Delete key on your keyboard
- Or right-click and select delete

**Q: Can I connect Start directly to Action?**
- Yes! But typically you want: Start → Condition → Action
- The condition determines WHEN the action happens

## Example Workflow

1. **Add Start** node → Purple node appears
2. **Add Condition** → Blue "IF" node appears
3. **Add Action** → Green "THEN" node appears
4. **Connect Start to Condition**:
   - Drag from Start's right handle → Condition's left handle
5. **Connect Condition to Action**:
   - Drag from Condition's right handle → Action's left handle
6. **Save your rule** → Click "Save Rule" button

Your flow should look like:
```
[Start] ──────→ [IF] ──────→ [THEN]
```

Now you're ready to test and save your rule! 🎉
