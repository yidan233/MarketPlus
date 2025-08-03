import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      const response = await authService.checkStatus()
      if (response.authenticated) {
        setUser(response.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth status check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      setError(null)
      const response = await authService.login(credentials)
      setUser(response.user)
      return response
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed')
      throw error
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      const response = await authService.register(userData)
      return response
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed')
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
      // Still clear user state even if logout request fails
      setUser(null)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 