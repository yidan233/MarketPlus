import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const { login, error, clearError } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    clearError()

    try {
      await login(credentials)
      navigate('/') 
    } catch (error) {
      // err is already displayed ...
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Welcome Back</h1>
        <p>Sign in to your account</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
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
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={isLoading} className="auth-button">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <button 
            type="button" 
            onClick={() => navigate('/signup')}
            className="link-button"
          >
            Sign up here
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login 