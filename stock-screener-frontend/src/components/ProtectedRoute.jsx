import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children, redirectTo = '/login', message = 'Please sign in to access this page' }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    )
  }

  if (!user) {
    // Store the message in sessionStorage so Login page can display it
    sessionStorage.setItem('authMessage', message)
    return <Navigate to={redirectTo} replace />
  }

  return children
}

export default ProtectedRoute 