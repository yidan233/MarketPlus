import axios from 'axios' // use to make http requests 

const API_BASE_URL = 'http://localhost:5000/api/v1'

// Create axios instance for API calls
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Stock screening API
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