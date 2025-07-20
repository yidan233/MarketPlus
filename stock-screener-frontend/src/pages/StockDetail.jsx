import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { stockApi } from '../services/api'
import PriceChart from '../components/PriceChart'
import styles from './StockDetail.module.css'

const StockInfo = () => {
  const { symbol } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedChart, setSelectedChart] = useState('price')

  useEffect(() => {
    setLoading(true)
    stockApi.getStockDetail(symbol)
      .then(setData)
      .catch((err) => setError(err.message || 'Error loading stock'))
      .finally(() => setLoading(false))
  }, [symbol])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return <div>No data found.</div>

  const { info, historical } = data

  // Placeholder for financials chart/component
  const FinancialsChart = () => (
    <div className={styles.financialsChart}>
      <span>Financial Statement Chart (Coming Soon)</span>
    </div>
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          onClick={() => window.close()}
          style={{
            background: '#232a34',
            color: '#4f8cff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 18px',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            marginBottom: '1rem',
            marginRight: '1.5rem'
          }}
        >
          ← Back to Screener
        </button>
        <h1 className={styles.title}>
          {info.shortName} <span style={{ color: '#7fa7ff' }}>({info.symbol})</span>
        </h1>
        <div className={styles.subtitle}>
          {info.sector} | {info.industry}
        </div>
        <div>
          <a href={info.website} target="_blank" rel="noopener noreferrer" className={styles.link}>
            {info.website}
          </a>
        </div>
      </div>
      <div className={styles.mainRow}>
        {/* Left: Company Description */}
        <div className={styles.leftCol}>
          <div className={styles.sectionTitle}>Company Description</div>
          <div className={styles.companyDescription}>
            {info.longBusinessSummary || "No description available."}
          </div>
        </div>
        {/* Right: Metrics and Chart */}
        <div className={styles.rightCol}>
          <div className={styles.sectionTitle}>Key Metrics</div>
          <table className={styles.metricsTable}>
            <tbody>
              <tr>
                <td>Market Cap</td>
                <td>{info.marketCap || 'N/A'}</td>
              </tr>
              <tr>
                <td>P/E Ratio</td>
                <td>{info.peRatio || info.trailingPE || 'N/A'}</td>
              </tr>
              <tr>
                <td>Dividend Yield</td>
                <td>{info.dividendYield || 'N/A'}</td>
              </tr>
              <tr>
                <td>Beta</td>
                <td>{info.beta || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
          <div className={styles.sectionTitle} style={{ marginTop: '2rem' }}>
            Chart
            <select
              value={selectedChart}
              onChange={e => setSelectedChart(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #333',
                background: '#232a34',
                color: '#e0e6ef',
                marginLeft: '1rem'
              }}
            >
              <option value="price">Price History</option>
              <option value="financials">Financial Statement</option>
            </select>
          </div>
          <div className={styles.chartSection}>
            {selectedChart === 'price' && <PriceChart data={historical} />}
            {selectedChart === 'financials' && <FinancialsChart />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StockInfo
