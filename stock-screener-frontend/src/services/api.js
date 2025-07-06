import axios from 'axios' // use to make http requests 

const API_BASE_URL = 'http://localhost:5000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})
// Screen stocks with combined criteria
export const stockApi = {
  // Fundamental screening only 
  screenFundamental: async (data) => {
    const response = await api.post('/screen/fundamental', data)
    return response.data
  },

  // Technical screening only 
  screenTechnical: async (data) => {
    const response = await api.post('/screen/technical', data)
    return response.data
  },

  // Combined screening
  screenStocks: async (data) => {
    const response = await api.post('/screen/combined', data)
    return response.data
  },

  // Get available indexes
  getIndexes: async () => {
    const response = await api.get('/indexes')
    return response.data
  },

  // Get available indicators and fields for the criteria 
  getIndicators: async () => {
    const response = await api.get('/indicators')
    return response.data
  },

  // Get stock symbols for an index
  getSymbols: async (index) => {
    const response = await api.get(`/symbols/${index}`)
    return response.data
  },

  // Get detailed info for a single stock
  getStockDetail: async (symbol) => {
    const response = await api.get(`/stock/${symbol}`)
    return response.data
  },
}