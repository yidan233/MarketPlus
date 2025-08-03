// Frontend User Database Service
// Uses localStorage to persist user data across sessions

const USERS_STORAGE_KEY = 'stock_screener_users'

// Initialize with demo user if no users exist
const initializeUsers = () => {
  const existingUsers = localStorage.getItem(USERS_STORAGE_KEY)
  if (!existingUsers) {
    const defaultUsers = [
      {
        id: 1,
        username: 'demo',
        email: 'demo@example.com',
        password: 'demo123', // In real app, this would be hashed
        createdAt: new Date().toISOString()
      }
    ]
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers))
    return defaultUsers
  }
  return JSON.parse(existingUsers)
}

// Get all users
export const getUsers = () => {
  try {
    return initializeUsers()
  } catch (error) {
    console.error('Error getting users:', error)
    return []
  }
}

// Find user by credentials
export const findUserByCredentials = (username, password) => {
  const users = getUsers()
  return users.find(user => 
    user.username === username && user.password === password
  )
}

// Find user by username or email
export const findUserByUsernameOrEmail = (username, email) => {
  const users = getUsers()
  return users.find(user => 
    user.username === username || user.email === email
  )
}

// Add new user
export const addUser = (userData) => {
  try {
    const users = getUsers()
    
    // Check if user already exists
    const existingUser = findUserByUsernameOrEmail(userData.username, userData.email)
    if (existingUser) {
      throw new Error('Username or email already exists')
    }
    
    // Create new user
    const newUser = {
      id: Date.now(), // Simple ID generation
      username: userData.username,
      email: userData.email,
      password: userData.password, // In real app, hash this
      createdAt: new Date().toISOString()
    }
    
    // Add to users array
    users.push(newUser)
    
    // Save back to localStorage
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
    
    return newUser
  } catch (error) {
    console.error('Error adding user:', error)
    throw error
  }
}

// Update user
export const updateUser = (userId, updates) => {
  try {
    const users = getUsers()
    const userIndex = users.findIndex(user => user.id === userId)
    
    if (userIndex === -1) {
      throw new Error('User not found')
    }
    
    // Update user data
    users[userIndex] = { ...users[userIndex], ...updates }
    
    // Save back to localStorage
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
    
    return users[userIndex]
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

// Delete user
export const deleteUser = (userId) => {
  try {
    const users = getUsers()
    const filteredUsers = users.filter(user => user.id !== userId)
    
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filteredUsers))
    
    return true
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

// Get user by ID
export const getUserById = (userId) => {
  const users = getUsers()
  return users.find(user => user.id === userId)
}

// Clear all users (for testing)
export const clearAllUsers = () => {
  localStorage.removeItem(USERS_STORAGE_KEY)
  initializeUsers() // Reinitialize with demo user
} 