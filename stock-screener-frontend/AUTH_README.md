# Frontend Authentication System

This document describes the frontend-controlled authentication system implemented in the stock screener application.

## Overview

The authentication system has been moved from backend-controlled to frontend-controlled, using localStorage for session persistence. This provides a simpler, more reliable authentication experience without depending on backend session management.

## Features

- **Frontend-only authentication**: No backend auth endpoints required
- **Session persistence**: User sessions are stored in localStorage
- **Mock user database**: Includes a demo user for testing
- **Automatic session restoration**: Users stay logged in across browser sessions
- **Simple logout**: Clears localStorage and user state

## Demo User

For testing purposes, a demo user is included:

- **Username**: `demo`
- **Password**: `demo123`
- **Email**: `demo@example.com`

## How It Works

### Authentication Flow

1. **Login**: User enters credentials → validated against mock database → user data stored in localStorage
2. **Session Check**: On app load, checks localStorage for existing user session
3. **Logout**: Clears localStorage and user state
4. **Registration**: Validates against existing users (currently just returns success message)

### Key Components

- **AuthContext**: Manages authentication state and provides auth methods
- **localStorage**: Stores user session data
- **Mock Users**: Simple in-memory user database for testing

## Usage

### Basic Authentication

```jsx
import { useAuth } from '../contexts/AuthContext'

const MyComponent = () => {
  const { user, login, logout, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  if (!user) {
    return <button onClick={() => login({ username: 'demo', password: 'demo123' })}>
      Login
    </button>
  }
  
  return (
    <div>
      <p>Welcome, {user.username}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Protected Routes

```jsx
import ProtectedRoute from '../components/ProtectedRoute'

// In your router
<Route 
  path="/protected" 
  element={
    <ProtectedRoute>
      <ProtectedComponent />
    </ProtectedRoute>
  } 
/>
```

## Customization

### Adding Real User Management

To replace the mock system with real user management:

1. **Replace MOCK_USERS**: Connect to your own user database
2. **Add password hashing**: Use bcrypt or similar for password security
3. **Add user registration**: Implement actual user creation logic
4. **Add validation**: Add proper input validation and error handling

### Example with Real Database

```jsx
// In AuthContext.jsx
const login = async (credentials) => {
  try {
    // Replace with your actual API call
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })
    
    if (!response.ok) throw new Error('Login failed')
    
    const userData = await response.json()
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    
    return userData
  } catch (error) {
    setError(error.message)
    throw error
  }
}
```

## Security Considerations

- **localStorage is not secure**: Sensitive data should not be stored in localStorage
- **No password storage**: User passwords are never stored in localStorage
- **Client-side only**: This system is suitable for demo/development use
- **Production use**: For production, consider implementing proper JWT tokens or server-side sessions

## Benefits

- **Simplified architecture**: No backend auth complexity
- **Faster development**: No need to manage server-side sessions
- **Better UX**: Instant authentication state changes
- **Offline capability**: Works without backend connectivity
- **Easy testing**: Simple mock system for development

## Migration from Backend Auth

The system has been migrated from backend authentication:

- ✅ Removed `authService` API calls
- ✅ Removed `authApi` axios instance
- ✅ Updated `AuthContext` to use localStorage
- ✅ Maintained existing component interfaces
- ✅ Added session persistence
- ✅ Created `ProtectedRoute` component for future use 