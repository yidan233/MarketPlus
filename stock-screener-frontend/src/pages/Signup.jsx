import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

const Signup = () => {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const { register, error, clearError } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    clearError()

    if (userData.password !== userData.confirmPassword) {
      // Handle password mismatch
      return
    }

    try {
      await register({
        username: userData.username,
        email: userData.email,
        password: userData.password
      })
      navigate('/login') // Redirect to login after successful registration
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Create Account</h1>
        <p>Join us to start screening stocks</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={userData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={userData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={userData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={userData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={isLoading} className="auth-button">
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <button 
            type="button" 
            onClick={() => navigate('/login')}
            className="link-button"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  )
}

export default Signup 