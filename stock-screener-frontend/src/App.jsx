import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import FloatingChatbot from './components/FloatingChatbot'
import Screener from './pages/Screener'
import StockDetail from './pages/StockDetail'
import StockSearch from './pages/StockSearch'
import News from './pages/News'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Watchlist from './pages/Watchlist'
import './App.css'
import indexedDBService from './services/indexedDB'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Initialize database only (no daily cleanup needed)
    const initializeDB = async () => {
      try {
        await indexedDBService.init();
      } catch (error) {
        console.error('Database initialization failed:', error);
      }
    };

    initializeDB();
  }, []);

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
            <Route path="/stock-search" element={<StockSearch />} />
            <Route path="/news" element={<News />} />
            <Route 
              path="/watchlist" 
              element={
                <ProtectedRoute message="Please sign in to access your watchlist">
                  <Watchlist />
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
          <FloatingChatbot />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
