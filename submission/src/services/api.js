// API service for communicating with backend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`)
    }
    
    return data
  } catch (error) {
    console.error('API call failed:', error)
    throw error
  }
}

// ==================== LEDGER API ====================

export const ledgerAPI = {
  // Create a reward
  createReward: async ({ userId, amount, referenceId, description, metadata }) => {
    return apiCall('/ledger/rewards', {
      method: 'POST',
      body: JSON.stringify({ userId, amount, referenceId, description, metadata })
    })
  },

  // Get user entries
  getUserEntries: async (userId) => {
    return apiCall(`/ledger/users/${userId}/entries`)
  },

  // Get user balance
  getUserBalance: async (userId) => {
    const result = await apiCall(`/ledger/users/${userId}/balance`)
    return result.balance
  },

  // Update entry status
  updateEntryStatus: async (entryId, status) => {
    return apiCall(`/ledger/entries/${entryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  },

  // Reverse an entry
  reverseEntry: async (entryId, reason) => {
    return apiCall(`/ledger/entries/${entryId}/reverse`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
  }
}

// ==================== RULES API ====================

export const rulesAPI = {
  // Create a rule
  createRule: async ({ name, conditions, actions, enabled = true }) => {
    return apiCall('/rules', {
      method: 'POST',
      body: JSON.stringify({ name, conditions, actions, enabled })
    })
  },

  // Get all rules
  getAllRules: async () => {
    return apiCall('/rules')
  },

  // Get a single rule
  getRule: async (ruleId) => {
    return apiCall(`/rules/${ruleId}`)
  },

  // Delete a rule
  deleteRule: async (ruleId) => {
    return apiCall(`/rules/${ruleId}`, {
      method: 'DELETE'
    })
  }
}

// Health check
export const healthCheck = async () => {
  return apiCall('/health')
}
