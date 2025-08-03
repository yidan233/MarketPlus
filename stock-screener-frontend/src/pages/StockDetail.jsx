import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { stockApi } from '../services/api'
import PriceChart from '../components/charts/PriceChart'
import styles from './StockDetail.module.css'

const StockInfo = () => {
  const { symbol } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedChart, setSelectedChart] = useState('price')
  const [selectedCategory, setSelectedCategory] = useState(0); // default to the first

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

  const { info } = data

  // Define metric categories and their fields 
  // show important metrics 
  const metricCategories = [
    {
      title: 'Valuation Metrics',
      fields: [
        { key: 'marketCap', label: 'Market Cap' },
        { key: 'trailingPE', label: 'P/E Ratio (TTM)' },
        { key: 'forwardPE', label: 'Forward P/E' },
        { key: 'priceToBook', label: 'Price-to-Book' },
        { key: 'enterpriseValue', label: 'Enterprise Value' },
        { key: 'enterpriseToEbitda', label: 'EV/EBITDA' },
        { key: 'pegRatio', label: 'PEG Ratio' },
      ]
    },
    {
      title: 'Profitability',
      fields: [
        { key: 'profitMargins', label: 'Net Profit Margin' },
        { key: 'operatingMargins', label: 'Operating Margin' },
        { key: 'returnOnAssets', label: 'Return on Assets' },
        { key: 'returnOnEquity', label: 'Return on Equity' },
        { key: 'grossMargins', label: 'Gross Margin' },
      ]
    },
    {
      title: 'Growth Metrics',
      fields: [
        { key: 'revenueGrowth', label: 'Revenue Growth (YoY)' },
        { key: 'earningsGrowth', label: 'Earnings Growth (YoY)' },
        { key: 'ebitdaMargins', label: 'EBITDA Margin' },
      ]
    },
    {
      title: 'Dividends',
      fields: [
        { key: 'dividendYield', label: 'Dividend Yield' },
        { key: 'payoutRatio', label: 'Payout Ratio' },
        { key: 'dividendRate', label: 'Dividend Rate' },
      ]
    },
    {
      title: 'Balance Sheet Health',
      fields: [
        { key: 'debtToEquity', label: 'Debt to Equity' },
        { key: 'currentRatio', label: 'Current Ratio' },
        { key: 'quickRatio', label: 'Quick Ratio' },
      ]
    },
    {
      title: 'Stock Basics',
      fields: [
        { key: 'beta', label: 'Beta' },
        { key: 'volume', label: 'Volume' },
        { key: 'averageVolume', label: 'Avg Volume (3M)' },
        { key: 'fiftyTwoWeekHigh', label: '52-Week High' },
        { key: 'fiftyTwoWeekLow', label: '52-Week Low' },
        { key: 'previousClose', label: 'Previous Close' },
        { key: 'open', label: 'Open' },
      ]
    },
  ];

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
          className={styles.backButton}
        >
          ← Close
        </button>
        {/* company title */}
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
          <div className={styles.metricsTabs}>
            {/* buttons , when clicked, call setSelectedCategory*/}
            {metricCategories.map((category, idx) => (
              <button
                key={category.title}
                className={`${styles.metricsTab} ${selectedCategory === idx ? styles.activeTab : ''}`} 
                onClick={() => setSelectedCategory(idx)}
              >
                {category.title}
              </button>
            ))}
          </div>
          {/* metrics table */}
          <div className={styles.metricsCard}>
            <div className={styles.metricsCategoryTitle}>
              {metricCategories[selectedCategory].title}
            </div>
            <table className={styles.metricsTable}>
              <tbody>
                {metricCategories[selectedCategory].fields.map(field => (
                  info[field.key] !== undefined && (
                    <tr key={field.key}>
                      <td>{field.label}</td>
                      <td>{info[field.key] !== null ? info[field.key] : 'N/A'}</td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>

          {/* charts */}
          <div className={`${styles.sectionTitle} ${styles.chartSectionTitle}`}>
            Chart
            <select
              value={selectedChart}
              onChange={e => setSelectedChart(e.target.value)}
              className={styles.chartSelect}
            >
              <option value="price">Price History</option>
              <option value="volume">Volume</option>
              <option value="ma">Moving Average</option>
            </select>
          </div>
          <div className={styles.chartSection}>
            {selectedChart === 'price' && <PriceChart data={data.historical} />}
            {selectedChart === 'volume' && (
              <div style={{color: '#fff', background: '#232a34', padding: '1rem', borderRadius: '8px'}}>
                <strong>Volume Chart (dev placeholder)</strong>
              </div>
            )}
            {selectedChart === 'ma' && (
              <div style={{color: '#fff', background: '#232a34', padding: '1rem', borderRadius: '8px'}}>
                <strong>Moving Average Chart (dev placeholder)</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StockInfo
