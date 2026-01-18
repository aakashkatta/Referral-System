import React, { useState, useEffect } from 'react'
import { LedgerEntryType, RewardStatus } from '../models/ledger'
import { ledgerAPI } from '../services/api'
import { Plus, CheckCircle, XCircle, ArrowLeftRight, DollarSign, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

function FinancialLedger() {
  const [entries, setEntries] = useState([])
  const [selectedUser, setSelectedUser] = useState('user-1')
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    referenceId: '',
    description: ''
  })

  useEffect(() => {
    loadEntries()
  }, [selectedUser])

  const loadEntries = async () => {
    try {
      setLoading(true)
      const [userEntries, userBalance] = await Promise.all([
        ledgerAPI.getUserEntries(selectedUser),
        ledgerAPI.getUserBalance(selectedUser)
      ])
      setEntries(userEntries)
      setBalance(userBalance)
    } catch (error) {
      console.error('Error loading entries:', error)
      alert('Failed to load entries: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReward = async (e) => {
    e.preventDefault()
    try {
      const result = await ledgerAPI.createReward({
        userId: selectedUser,
        amount: parseFloat(formData.amount),
        referenceId: formData.referenceId || `ref-${Date.now()}`,
        description: formData.description || 'Referral reward'
      })

      if (result.success) {
        if (result.isDuplicate) {
          alert('Reward with this reference ID already exists (idempotent operation)')
        }
        await loadEntries()
        setShowCreateModal(false)
        setFormData({ amount: '', referenceId: '', description: '' })
      }
    } catch (error) {
      console.error('Error creating reward:', error)
      alert('Failed to create reward: ' + error.message)
    }
  }

  const handleConfirm = async (entryId) => {
    try {
      const result = await ledgerAPI.updateEntryStatus(entryId, 'confirmed')
      if (result.success) {
        await loadEntries()
      } else {
        alert(result.error || 'Failed to confirm reward')
      }
    } catch (error) {
      console.error('Error confirming reward:', error)
      alert('Failed to confirm reward: ' + error.message)
    }
  }

  const handleMarkAsPaid = async (entryId) => {
    try {
      const result = await ledgerAPI.updateEntryStatus(entryId, 'paid')
      if (result.success) {
        await loadEntries()
      } else {
        alert(result.error || 'Failed to mark as paid')
      }
    } catch (error) {
      console.error('Error marking as paid:', error)
      alert('Failed to mark as paid: ' + error.message)
    }
  }

  const handleReverse = async (entryId) => {
    const reason = prompt('Enter reversal reason:')
    if (reason) {
      try {
        const result = await ledgerAPI.reverseEntry(entryId, reason)
        if (result.success) {
          await loadEntries()
        } else {
          alert(result.error || 'Failed to reverse entry')
        }
      } catch (error) {
        console.error('Error reversing entry:', error)
        alert('Failed to reverse entry: ' + error.message)
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case RewardStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case RewardStatus.CONFIRMED:
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case RewardStatus.PAID:
        return 'bg-green-100 text-green-800 border-green-300'
      case RewardStatus.REVERSED:
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case LedgerEntryType.CREDIT:
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case LedgerEntryType.REVERSAL:
        return <ArrowLeftRight className="w-5 h-5 text-red-600" />
      default:
        return <DollarSign className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Financial Ledger</h2>
              <p className="text-gray-600">Immutable ledger for referral rewards</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Current Balance</div>
              <div className="text-4xl font-bold text-purple-600">${balance.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* User Selector */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select User
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="user-1">User 1</option>
            <option value="user-2">User 2</option>
            <option value="user-3">User 3</option>
          </select>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Reward
          </button>
        </div>

        {/* Ledger Entries */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Ledger Entries</h3>
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No ledger entries yet. Create your first reward!
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="mt-1">{getTypeIcon(entry.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-semibold text-gray-800">
                            {entry.type === LedgerEntryType.REVERSAL ? 'Reversal' : 'Reward'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-1">{entry.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Ref: {entry.referenceId}</span>
                          <span>•</span>
                          <span>{format(new Date(entry.createdAt), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          entry.type === LedgerEntryType.REVERSAL ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {entry.type === LedgerEntryType.REVERSAL ? '-' : '+'}${entry.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {entry.status === RewardStatus.PENDING && (
                      <button
                        onClick={() => handleConfirm(entry.id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Confirm
                      </button>
                    )}
                    {entry.status === RewardStatus.CONFIRMED && (
                      <button
                        onClick={() => handleMarkAsPaid(entry.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark as Paid
                      </button>
                    )}
                    {entry.status !== RewardStatus.REVERSED && entry.type === LedgerEntryType.CREDIT && (
                      <button
                        onClick={() => handleReverse(entry.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reverse
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Reward Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Create Reward</h3>
              <form onSubmit={handleCreateReward}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference ID (for idempotency)
                  </label>
                  <input
                    type="text"
                    value={formData.referenceId}
                    onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Optional (auto-generated if empty)"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                    placeholder="Reward description"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
                  >
                    Create Reward
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FinancialLedger
