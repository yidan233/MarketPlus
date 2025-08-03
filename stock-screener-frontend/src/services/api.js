import axios from 'axios' // use to make http requests 

const API_BASE_URL = 'http://localhost:5000/api/v1'

// Create separate axios instances
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Remove withCredentials for general API calls
})

// Create auth-specific axios instance with credentials
const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  
})

// Authentication API - Make consistent with stockApi
export const authService = {
  register: async (userData) => {
    const response = await authApi.post('/auth/register', userData)
    return response.data
  },
  login: async (credentials) => {
    const response = await authApi.post('/auth/login', { 
      ...credentials, 
      remember: true 
    })
    return response.data
  },
  logout: async () => {
    const response = await authApi.post('/auth/logout')
    return response.data
  },
  checkStatus: async () => {
    const response = await authApi.get('/auth/status')
    return response.data
  },
  getProfile: async () => {
    const response = await authApi.get('/auth/profile')
    return response.data
  }
}

// Screen stocks with combined criteria (no credentials needed)
export const stockApi = {
  screenFundamental: async (data) => {
    const response = await api.post('/screen/fundamental', data)
    return response.data
  },

  screenTechnical: async (data) => {
    const response = await api.post('/screen/technical', data)
    return response.data
  },

  screenStocks: async (data) => {
    const response = await api.post('/screen/combined', data)
    return response.data
  },

  getIndexes: async () => {
    const response = await api.get('/indexes')
    return response.data
  },

  getIndicators: async () => {
    const response = await api.get('/indicators')
    return response.data
  },

  getSymbols: async (index) => {
    const response = await api.get(`/symbols/${index}`)
    return response.data
  },

  getStockDetail: async (symbol) => {
    const response = await api.get(`/stock/${symbol}`)
    return response.data
  },
}