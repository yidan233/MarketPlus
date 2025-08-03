import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import Screener from './pages/Screener'
import StockDetail from './pages/StockDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'
import './App.css'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <button
            className={`sidebar-toggle ${sidebarOpen ? 'hidden' : ''}`}
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <Routes>
            <Route path="/" element={<Screener />} />
            <Route path="/stock/:symbol" element={<StockDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
