import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  findUserByCredentials, 
  findUserByUsernameOrEmail, 
  addUser 
} from '../services/userDatabase'

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

  const checkAuthStatus = () => {
    try {
      setLoading(true)
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth status check failed:', error)
      setUser(null)
      localStorage.removeItem('user')
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      setError(null)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Find user in database
      const foundUser = findUserByCredentials(credentials.username, credentials.password)
      
      if (!foundUser) {
        throw new Error('Invalid username or password')
      }
      
      // Create user object without password
      const userData = {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        createdAt: foundUser.createdAt
      }
      
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      
      return { user: userData, message: 'Login successful' }
    } catch (error) {
      const errorMessage = error.message || 'Login failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Check if user already exists
      const existingUser = findUserByUsernameOrEmail(userData.username, userData.email)
      
      if (existingUser) {
        throw new Error('Username or email already exists')
      }
      
      // Add new user to database
      const newUser = addUser(userData)
      
      return { 
        message: 'Registration successful! You can now log in.',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          createdAt: newUser.createdAt
        }
      }
    } catch (error) {
      const errorMessage = error.message || 'Registration failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const logout = () => {
    try {
      localStorage.removeItem('user')
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
      // Still clear user state even if localStorage removal fails
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