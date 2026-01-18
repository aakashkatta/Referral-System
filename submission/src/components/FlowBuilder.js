import React, { useState, useCallback, useEffect } from 'react'
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    MarkerType,
    Handle,
    Position
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Condition, Action, Rule, ConditionType, Operator, ActionType } from '../models/rules'
import { rulesAPI } from '../services/api'
import { Save, Play, Trash2 } from 'lucide-react'

function StartNode({ data }) {
    return (
        <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg shadow-lg border-2 border-white">
            <div className="font-bold text-lg">Start</div>
            <div className="text-sm opacity-90">{data.label}</div>
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white border-2 border-purple-500" />
        </div>
    )
}

function ConditionNode({ data, selected }) {
    return (
        <div className={`px-6 py-4 bg-blue-50 border-2 rounded-lg shadow-lg ${selected ? 'border-blue-500' : 'border-blue-300'
            }`}>
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-white border-2 border-blue-500" />
            <div className="font-bold text-blue-800 mb-2">IF</div>
            <div className="text-sm text-gray-700">
                <div className="font-semibold">{data.field}</div>
                <div className="text-gray-500">{data.operator} {data.value}</div>
            </div>
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white border-2 border-blue-500" />
        </div>
    )
}

function ActionNode({ data, selected }) {
    return (
        <div className={`px-6 py-4 bg-green-50 border-2 rounded-lg shadow-lg ${selected ? 'border-green-500' : 'border-green-300'
            }`}>
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-white border-2 border-green-500" />
            <div className="font-bold text-green-800 mb-2">THEN</div>
            <div className="text-sm text-gray-700">
                <div className="font-semibold">{data.type}</div>
                {data.params && (
                    <div className="text-gray-500 mt-1">
                        {data.params.amount && `$${data.params.amount}`}
                        {data.params.message && data.params.message}
                    </div>
                )}
            </div>
        </div>
    )
}

const nodeTypes = {
    condition: ConditionNode,
    action: ActionNode,
    start: StartNode
}

function FlowBuilder() {
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [showRuleModal, setShowRuleModal] = useState(false)
    const [showConditionModal, setShowConditionModal] = useState(false)
    const [showActionModal, setShowActionModal] = useState(false)
    const [selectedNode, setSelectedNode] = useState(null)
    const [rules, setRules] = useState([])
    const [ruleForm, setRuleForm] = useState({ name: '' })
    const [conditionForm, setConditionForm] = useState({
        field: 'userType',
        operator: Operator.EQUALS,
        value: 'paid'
    })
    const [actionForm, setActionForm] = useState({
        type: ActionType.REWARD,
        amount: '500',
        description: 'Referral reward'
    })

    useEffect(() => {
        loadRules()
    }, [])

    const loadRules = async () => {
        try {
            const allRules = await rulesAPI.getAllRules()
            // Convert database rules to Rule objects for evaluation
            const ruleObjects = allRules.map(ruleData => {
                const conditions = ruleData.conditions.map(c => new Condition({
                    id: c.id,
                    type: c.type,
                    field: c.field,
                    operator: c.operator,
                    value: c.value
                }))
                const actions = ruleData.actions.map(a => new Action({
                    id: a.id,
                    type: a.type,
                    params: a.params
                }))
                return new Rule({
                    id: ruleData.id,
                    name: ruleData.name,
                    conditions,
                    actions,
                    enabled: ruleData.enabled
                })
            })
            setRules(ruleObjects)
        } catch (error) {
            console.error('Error loading rules:', error)
            alert('Failed to load rules: ' + error.message)
        }
    }

    const onConnect = useCallback(
        (params) => {
            setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds))
        },
        [setEdges]
    )

    const addStartNode = () => {
        const newNode = {
            id: `start-${Date.now()}`,
            type: 'start',
            position: { x: 100, y: 250 },
            data: { label: 'Rule Start' }
        }
        setNodes((nds) => [...nds, newNode])
    }

    const addConditionNode = () => {
        const condition = new Condition({
            id: `condition-${Date.now()}`,
            type: ConditionType.USER_PROPERTY,
            field: conditionForm.field,
            operator: conditionForm.operator,
            value: conditionForm.value
        })

        const newNode = {
            id: condition.id,
            type: 'condition',
            position: { x: 300, y: 250 },
            data: {
                ...conditionForm,
                condition
            }
        }
        setNodes((nds) => [...nds, newNode])
        setShowConditionModal(false)
        setConditionForm({ field: 'userType', operator: Operator.EQUALS, value: 'paid' })
    }

    const addActionNode = () => {
        const action = new Action({
            id: `action-${Date.now()}`,
            type: actionForm.type,
            params: {
                amount: parseFloat(actionForm.amount),
                description: actionForm.description
            }
        })

        const newNode = {
            id: action.id,
            type: 'action',
            position: { x: 500, y: 250 },
            data: {
                type: actionForm.type,
                params: actionForm.params,
                action
            }
        }
        setNodes((nds) => [...nds, newNode])
        setShowActionModal(false)
        setActionForm({ type: ActionType.REWARD, amount: '500', description: 'Referral reward' })
    }

    const saveRule = async () => {
        const conditions = nodes
            .filter(n => n.type === 'condition')
            .map(n => n.data.condition)

        const actions = nodes
            .filter(n => n.type === 'action')
            .map(n => n.data.action)

        if (conditions.length === 0 || actions.length === 0) {
            alert('Please add at least one condition and one action')
            return
        }

        try {
            // Prepare data for API
            const conditionsData = conditions.map(c => ({
                id: c.id,
                type: c.type,
                field: c.field,
                operator: c.operator,
                value: c.value
            }))

            const actionsData = actions.map(a => ({
                id: a.id,
                type: a.type,
                params: a.params
            }))

            await rulesAPI.createRule({
                name: ruleForm.name || `Rule ${rules.length + 1}`,
                conditions: conditionsData,
                actions: actionsData,
                enabled: true
            })

            await loadRules()
            setShowRuleModal(false)
            setRuleForm({ name: '' })
            alert('Rule saved successfully!')
        } catch (error) {
            console.error('Error saving rule:', error)
            alert('Failed to save rule: ' + error.message)
        }
    }

    const testRule = (ruleId) => {
        const rule = rules.find(r => r.id === ruleId)
        if (!rule) return

        // Test context with values that should match common rules
        const testContext = {
            userType: 'paid',
            eventType: 'subscription',
            amount: 500  // Increased to match "greater_than 200" conditions
        }

        const results = rule.execute(testContext)

        // Show detailed test results
        const contextStr = JSON.stringify(testContext, null, 2)

        if (results.length > 0) {
            alert(`✅ Rule Matched!\n\nTest Context:\n${contextStr}\n\nActions Executed:\n${JSON.stringify(results, null, 2)}`)
        } else {
            // Show why it didn't match
            const conditionDetails = rule.conditions.map(c =>
                `Field: ${c.field}, Operator: ${c.operator}, Value: ${c.value}\nActual: ${testContext[c.field] || 'undefined'}`
            ).join('\n\n')

            alert(`❌ Rule did not match the test context\n\nTest Context:\n${contextStr}\n\nConditions Checked:\n${conditionDetails}\n\nTip: Adjust your test context or rule conditions to match.`)
        }
    }

    const deleteRule = async (ruleId) => {
        if (window.confirm('Are you sure you want to delete this rule?')) {
            try {
                await rulesAPI.deleteRule(ruleId)
                await loadRules()
            } catch (error) {
                console.error('Error deleting rule:', error)
                alert('Failed to delete rule: ' + error.message)
            }
        }
    }

    const clearCanvas = () => {
        if (window.confirm('Clear the canvas?')) {
            setNodes([])
            setEdges([])
        }
    }

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">Rule-Based Flow Builder</h2>
                            <p className="text-gray-600">Design referral logic with visual flows</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowRuleModal(true)}
                                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                Save Rule
                            </button>
                            <button
                                onClick={clearCanvas}
                                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                <Trash2 className="w-5 h-5 mr-2" />
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Flow Canvas */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-xl p-4" style={{ height: '600px' }}>
                            <div className="mb-4 flex space-x-2">
                                <button
                                    onClick={addStartNode}
                                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                                >
                                    Add Start
                                </button>
                                <button
                                    onClick={() => setShowConditionModal(true)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                                >
                                    Add Condition
                                </button>
                                <button
                                    onClick={() => setShowActionModal(true)}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                                >
                                    Add Action
                                </button>
                            </div>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                onNodeClick={(event, node) => setSelectedNode(node)}
                                nodeTypes={nodeTypes}
                                fitView
                            >
                                <Background />
                                <Controls />
                                <MiniMap />
                            </ReactFlow>
                        </div>
                    </div>

                    {/* Saved Rules */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Saved Rules</h3>
                            <div className="space-y-3">
                                {rules.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 text-sm">
                                        No rules saved yet. Build a flow and save it!
                                    </div>
                                ) : (
                                    rules.map((rule) => (
                                        <div
                                            key={rule.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-semibold text-gray-800">{rule.name}</h4>
                                                <button
                                                    onClick={() => deleteRule(rule.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="text-sm text-gray-600 mb-3">
                                                <div>{rule.conditions.length} condition(s)</div>
                                                <div>{rule.actions.length} action(s)</div>
                                            </div>
                                            <button
                                                onClick={() => testRule(rule.id)}
                                                className="w-full px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm flex items-center justify-center"
                                            >
                                                <Play className="w-4 h-4 mr-1" />
                                                Test Rule
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Rule Modal */}
                {showRuleModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">Save Rule</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rule Name
                                </label>
                                <input
                                    type="text"
                                    value={ruleForm.name}
                                    onChange={(e) => setRuleForm({ name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="e.g., Paid User Referral Reward"
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={saveRule}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setShowRuleModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Condition Modal */}
                {showConditionModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">Add Condition</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Field
                                </label>
                                <select
                                    value={conditionForm.field}
                                    onChange={(e) => setConditionForm({ ...conditionForm, field: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="userType">User Type</option>
                                    <option value="eventType">Event Type</option>
                                    <option value="amount">Amount</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Operator
                                </label>
                                <select
                                    value={conditionForm.operator}
                                    onChange={(e) => setConditionForm({ ...conditionForm, operator: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value={Operator.EQUALS}>Equals</option>
                                    <option value={Operator.NOT_EQUALS}>Not Equals</option>
                                    <option value={Operator.GREATER_THAN}>Greater Than</option>
                                    <option value={Operator.LESS_THAN}>Less Than</option>
                                    <option value={Operator.CONTAINS}>Contains</option>
                                </select>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Value
                                </label>
                                <input
                                    type="text"
                                    value={conditionForm.value}
                                    onChange={(e) => setConditionForm({ ...conditionForm, value: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter value"
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={addConditionNode}
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Add Condition
                                </button>
                                <button
                                    onClick={() => setShowConditionModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Modal */}
                {showActionModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">Add Action</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Action Type
                                </label>
                                <select
                                    value={actionForm.type}
                                    onChange={(e) => setActionForm({ ...actionForm, type: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value={ActionType.REWARD}>Reward</option>
                                    <option value={ActionType.NOTIFICATION}>Notification</option>
                                    <option value={ActionType.EMAIL}>Email</option>
                                    <option value={ActionType.WEBHOOK}>Webhook</option>
                                </select>
                            </div>
                            {actionForm.type === ActionType.REWARD && (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Amount ($)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={actionForm.amount}
                                            onChange={(e) => setActionForm({ ...actionForm, amount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="500"
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <input
                                            type="text"
                                            value={actionForm.description}
                                            onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="Referral reward"
                                        />
                                    </div>
                                </>
                            )}
                            <div className="flex space-x-3">
                                <button
                                    onClick={addActionNode}
                                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    Add Action
                                </button>
                                <button
                                    onClick={() => setShowActionModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default FlowBuilder
