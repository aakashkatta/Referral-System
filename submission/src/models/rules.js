// Rule-Based Flow Builder Data Models

export const ConditionType = {
    USER_PROPERTY: 'user_property',
    EVENT_TYPE: 'event_type',
    AMOUNT: 'amount',
    DATE: 'date',
    CUSTOM: 'custom'
}

export const Operator = {
    EQUALS: 'equals',
    NOT_EQUALS: 'not_equals',
    GREATER_THAN: 'greater_than',
    LESS_THAN: 'less_than',
    CONTAINS: 'contains',
    AND: 'and',
    OR: 'or'
}

export const ActionType = {
    REWARD: 'reward',
    NOTIFICATION: 'notification',
    EMAIL: 'email',
    WEBHOOK: 'webhook',
    CUSTOM: 'custom'
}

// Condition node
export class Condition {
    constructor({
        id,
        type,
        field,
        operator,
        value,
        children = [] // For nested AND/OR conditions
    }) {
        this.id = id
        this.type = type
        this.field = field
        this.operator = operator
        this.value = value
        this.children = children
    }

    evaluate(context) {
        // Check if field exists in context
        if (context[this.field] === undefined) {
            return false
        }

        // Simple evaluation logic (would be more complex in production)
        switch (this.operator) {
            case Operator.EQUALS:
                return String(context[this.field]) === String(this.value)
            case Operator.NOT_EQUALS:
                return String(context[this.field]) !== String(this.value)
            case Operator.GREATER_THAN:
                return parseFloat(context[this.field]) > parseFloat(this.value)
            case Operator.LESS_THAN:
                return parseFloat(context[this.field]) < parseFloat(this.value)
            case Operator.CONTAINS:
                return String(context[this.field]).includes(String(this.value))
            case Operator.AND:
                return this.children.every(child => child.evaluate(context))
            case Operator.OR:
                return this.children.some(child => child.evaluate(context))
            default:
                return false
        }
    }
}

// Action node
export class Action {
    constructor({
        id,
        type,
        params = {}
    }) {
        this.id = id
        this.type = type
        this.params = params
    }

    execute(context) {
        // Action execution logic
        switch (this.type) {
            case ActionType.REWARD:
                return {
                    type: 'reward',
                    amount: this.params.amount || 0,
                    currency: this.params.currency || 'USD',
                    description: this.params.description || 'Referral reward'
                }
            case ActionType.NOTIFICATION:
                return {
                    type: 'notification',
                    message: this.params.message || 'Notification sent'
                }
            default:
                return { type: this.type, params: this.params }
        }
    }
}

// Rule - connects conditions to actions
export class Rule {
    constructor({
        id,
        name,
        conditions = [],
        actions = [],
        enabled = true
    }) {
        this.id = id
        this.name = name
        this.conditions = conditions
        this.actions = actions
        this.enabled = enabled
    }

    evaluate(context) {
        if (!this.enabled) return false

        if (this.conditions.length === 0) return true

        // Evaluate all conditions (AND logic by default)
        return this.conditions.every(condition => condition.evaluate(context))
    }

    execute(context) {
        if (this.evaluate(context)) {
            return this.actions.map(action => action.execute(context))
        }
        return []
    }
}

// Rule Engine
export class RuleEngine {
    constructor() {
        this.rules = []
    }

    addRule(rule) {
        this.rules.push(rule)
    }

    removeRule(ruleId) {
        this.rules = this.rules.filter(r => r.id !== ruleId)
    }

    evaluate(context) {
        const results = []
        for (const rule of this.rules) {
            const actions = rule.execute(context)
            if (actions.length > 0) {
                results.push({
                    ruleId: rule.id,
                    ruleName: rule.name,
                    actions
                })
            }
        }
        return results
    }

    getAllRules() {
        return [...this.rules]
    }
}

// Singleton instance
export const ruleEngine = new RuleEngine()
