import { useState } from 'react'
import { stockApi } from '../services/api'
import CriteriaBuilder from './CriteriaBuilder'

// this component is the form for the stock screener 
// user can select the index, limit, and criteria 
const ScreenerForm = ({ onResults }) => {
  const [formData, setFormData] = useState({
    index: 'sp500',
    limit: 20,
    fundamental_criteria: '',
    technical_criteria: '',
    reload: false,
    period: '1y',
    interval: '1d'
  })
  
  const [loading, setLoading] = useState(false) // whether the API call is in progress 
  const [error, setError] = useState(null) // error message 


  const [fundamentalCriteria, setFundamentalCriteria] = useState([{ field: '', operator: '', value: '' }])
  const [technicalCriteria, setTechnicalCriteria] = useState([{ field: '', operator: '', value: '' }])

  const buildCriteriaString = arr =>
    arr
      .filter(c => c.field && c.operator && c.value)
      .map(c => `${c.field}${c.operator}${c.value}`)
      .join(',')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fundamental_criteria = buildCriteriaString(fundamentalCriteria)
    const technical_criteria = buildCriteriaString(technicalCriteria)

    // DEBUG LOGGING - need to be removed 
    console.log('Fundamental Criteria String:', fundamental_criteria)
    console.log('Technical Criteria String:', technical_criteria)

    try {
      let response;
      if (fundamental_criteria && !technical_criteria) {
        // Only fundamental
        response = await stockApi.screenFundamental({
          ...formData,
          criteria: fundamental_criteria,
        })
      } else if (!fundamental_criteria && technical_criteria) {
        // Only technical
        response = await stockApi.screenTechnical({
          ...formData,
          criteria: technical_criteria,
        })
      } else if (fundamental_criteria && technical_criteria) {
        // Both: use combined
        response = await stockApi.screenStocks({
          ...formData,
          fundamental_criteria,
          technical_criteria,
        })
      } else {
        setError('Please provide at least one screening criteria.')
        setLoading(false)
        return
      }
      // DEBUG LOGGING 
      console.log('API RESPONSEE', response)
      onResults(response)
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  // set the formData state based on the input change 
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="screener-form">
      <h2>Stock Screener</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Screen Settings</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Index:</label>
              <select 
                name="index" 
                value={formData.index} 
                onChange={handleInputChange}
              >
                <option value="sp500">S&P 500</option>
                <option value="nasdaq100">NASDAQ 100</option>
                <option value="dow30">Dow Jones 30</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Limit:</label>
              <input
                type="number"
                name="limit"
                value={formData.limit}
                onChange={handleInputChange}
                min="1"
                max="100"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Screening Criteria</h3>
          
          <div className="form-group">
            <label>Fundamental Criteria:</label>
            <CriteriaBuilder
              type="fundamental"
              criteria={fundamentalCriteria}
              setCriteria={setFundamentalCriteria}
            />
          </div>
          
          <div className="form-group">
            <label>Technical Criteria:</label>
            <CriteriaBuilder
              type="technical"
              criteria={technicalCriteria}
              setCriteria={setTechnicalCriteria}
            />
          </div>
        </div>

        <div className="form-section">
          <label>
            <input
              type="checkbox"
              name="reload"
              checked={formData.reload}
              onChange={handleInputChange}
            />
            Reload data (may take longer)
          </label>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="submit-button"
        >
          {loading ? 'Screening...' : 'Screen Stocks'}
        </button>
      </form>
    </div>
  )
}

export default ScreenerForm
