import { useState } from 'react'
import { stockApi } from '../services/api'
import CriteriaBuilder from './CriteriaBuilder'
import styles from './ScreenerForm.module.css'


// this component is the form for the stock screener 
// user can select the index, limit, and criteria 
const ScreenerForm = ({ onResults }) => {
  const [formData, setFormData] = useState({
    index: 'sp500',
    limit: 1000, // Set high limit to get all results
    fundamental_criteria: '',
    technical_criteria: '',
    reload: false,
    period: '1y',
    interval: '1d'
  })
  
  const [loading, setLoading] = useState(false) // whether the API call is in progress -> show loading spinner  
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
        onResults(response)  // Add this line
      } else if (!fundamental_criteria && technical_criteria) {
        // Only technical
        response = await stockApi.screenTechnical({
          ...formData,
          criteria: technical_criteria,
        })
        onResults(response)  // Add this line
      } else if (fundamental_criteria && technical_criteria) {
        // Both: use combined
        response = await stockApi.screenStocks({
          ...formData,
          fundamental_criteria,
          technical_criteria,
        })
        onResults(response)  // Add this line
      } else {
        setError('Please provide at least one screening criteria.')
        setLoading(false)
        return
      }
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
    <div className={styles["screener-form"]}>
      <h2>Set your Filters</h2>
      
      <form onSubmit={handleSubmit}>
        <div className={styles["form-section"]}>
          <h3>Stock Index</h3>
          
          <div className={styles["form-row"]}>
            <div className={styles["form-group"]}>
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
          </div>
        </div>

        <div className={styles["form-section"]}>
          <h3>Screening Criteria</h3>
          
          <div className={styles["form-group"]}>
            <label>Fundamental Criteria:</label>
            <CriteriaBuilder
              type="fundamental"
              criteria={fundamentalCriteria}
              setCriteria={setFundamentalCriteria}
            />
          </div>
          
          <div className={styles["form-group"]}>
            <label>Technical Criteria:</label>
            <CriteriaBuilder
              type="technical"
              criteria={technicalCriteria}
              setCriteria={setTechnicalCriteria}
            />
          </div>
        </div>

        <div className={styles["form-section"]}>
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
          <div className={styles["error-message"]}>
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className={styles["submit-button"]}
        >
          {loading ? 'Screening...' : 'Screen Stocks'}
        </button>
      </form>
    </div>
  )
}

export default ScreenerForm
