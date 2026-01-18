import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import FinancialLedger from './components/FinancialLedger'
import FlowBuilder from './components/FlowBuilder'
import { Wallet, Workflow } from 'lucide-react'

function Navigation() {
  const location = useLocation()
  
  return (
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white">Referral Management System</h1>
          </div>
          <div className="flex space-x-4">
            <Link
              to="/"
              className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                location.pathname === '/'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <Wallet className="w-5 h-5 mr-2" />
              Financial Ledger
            </Link>
            <Link
              to="/flow-builder"
              className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                location.pathname === '/flow-builder'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <Workflow className="w-5 h-5 mr-2" />
              Flow Builder
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navigation />
        <Routes>
          <Route path="/" element={<FinancialLedger />} />
          <Route path="/flow-builder" element={<FlowBuilder />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
