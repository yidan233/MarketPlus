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
  const [selectedCategory, setSelectedCategory] = useState(0)
  
  // New state for expandable sections
  const [expandedSections, setExpandedSections] = useState({
    priceSummary: true,
    metrics: true,
    chart: true,
    technical: false,
    peers: false,
    financials: false
  })

  useEffect(() => {
    setLoading(true)
    stockApi.getStockDetail(symbol)
      .then(setData)
      .catch((err) => setError(err.message || 'Error loading stock'))
      .finally(() => setLoading(false))
  }, [symbol])

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  if (loading) return <div className={styles.loadingContainer}>Loading...</div>
  if (error) return <div className={styles.errorContainer}>Error: {error}</div>
  if (!data) return <div className={styles.errorContainer}>No data found.</div>

  const { info } = data

  // Calculate price change and percentage
  const priceChange = info.regularMarketPrice - info.previousClose
  const priceChangePercent = ((priceChange / info.previousClose) * 100).toFixed(2)
  const isPositive = priceChange >= 0

  // Define metric categories and their fields 
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
  ]

  const formatValue = (value, key) => {
    if (value === null || value === undefined) return 'N/A'
    
    switch (key) {
      case 'marketCap':
      case 'enterpriseValue':
        return value >= 1e12 ? `${(value / 1e12).toFixed(2)}T` :
               value >= 1e9 ? `${(value / 1e9).toFixed(2)}B` :
               value >= 1e6 ? `${(value / 1e6).toFixed(2)}M` : value.toLocaleString()
      case 'volume':
      case 'averageVolume':
        return value.toLocaleString()
      case 'profitMargins':
      case 'operatingMargins':
      case 'returnOnAssets':
      case 'returnOnEquity':
      case 'grossMargins':
      case 'ebitdaMargins':
      case 'dividendYield':
      case 'payoutRatio':
        return `${(value * 100).toFixed(2)}%`
      case 'revenueGrowth':
      case 'earningsGrowth':
        return `${(value * 100).toFixed(2)}%`
      default:
        return typeof value === 'number' ? value.toFixed(2) : value
    }
  }

  return (
    <div className={styles.container}>
      {/* Enhanced Header Section */}
      <div className={styles.header}>
        <button onClick={() => window.close()} className={styles.backButton}>
          ← Close
        </button>
        <div className={styles.headerContent}>
          <div className={styles.companyInfo}>
            <h1 className={styles.title}>
              {info.shortName} <span className={styles.ticker}>({info.symbol})</span>
            </h1>
            <div className={styles.subtitle}>
              {info.sector} | {info.industry}
            </div>
            {info.website && (
              <a href={info.website} target="_blank" rel="noopener noreferrer" className={styles.link}>
                🌐 {info.website}
              </a>
            )}
          </div>
          <div className={styles.headerActions}>
            <button className={styles.watchlistButton}>
              ⭐ Add to Watchlist
            </button>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Price Summary Widget */}
        <div className={styles.priceSummarySection}>
          <div className={styles.sectionHeader} onClick={() => toggleSection('priceSummary')}>
            <h2>💰 Price Summary</h2>
            <span className={styles.expandIcon}>{expandedSections.priceSummary ? '▼' : '▶'}</span>
          </div>
          {expandedSections.priceSummary && (
            <div className={styles.priceSummaryCard}>
              <div className={styles.priceMain}>
                <div className={styles.currentPrice}>
                  ${info.regularMarketPrice?.toFixed(2) || 'N/A'}
                </div>
                <div className={`${styles.priceChange} ${isPositive ? styles.positive : styles.negative}`}>
                  {isPositive ? '↗' : '↘'} ${Math.abs(priceChange).toFixed(2)} ({Math.abs(priceChangePercent)}%)
                </div>
              </div>
              <div className={styles.priceDetails}>
                <div className={styles.priceRow}>
                  <span>Day Range:</span>
                  <span>${info.regularMarketDayLow?.toFixed(2) || 'N/A'} - ${info.regularMarketDayHigh?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className={styles.priceRow}>
                  <span>52W Range:</span>
                  <span>${info.fiftyTwoWeekLow?.toFixed(2) || 'N/A'} - ${info.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className={styles.priceRow}>
                  <span>Volume:</span>
                  <span>{info.volume?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className={styles.priceRow}>
                  <span>Market Cap:</span>
                  <span>{formatValue(info.marketCap, 'marketCap')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.contentGrid}>
          {/* Left Column */}
          <div className={styles.leftColumn}>
            {/* Company Description */}
            <div className={styles.section}>
              <div className={styles.sectionHeader} onClick={() => toggleSection('description')}>
                <h2>📋 Company Description</h2>
                <span className={styles.expandIcon}>{expandedSections.description !== false ? '▼' : '▶'}</span>
              </div>
              {expandedSections.description !== false && (
                <div className={styles.companyDescription}>
                  {info.longBusinessSummary || "No description available."}
                </div>
              )}
            </div>

            {/* Technical Indicators Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader} onClick={() => toggleSection('technical')}>
                <h2>🔧 Technical Indicators</h2>
                <span className={styles.expandIcon}>{expandedSections.technical ? '▼' : '▶'}</span>
              </div>
              {expandedSections.technical && (
                <div className={styles.technicalSection}>
                  <div className={styles.placeholderContent}>
                    <p>Technical indicators coming soon:</p>
                    <ul>
                      <li>RSI (Relative Strength Index)</li>
                      <li>MACD (Moving Average Convergence Divergence)</li>
                      <li>Bollinger Bands</li>
                      <li>Support/Resistance Levels</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.rightColumn}>
            {/* Metrics Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader} onClick={() => toggleSection('metrics')}>
                <h2>📊 Key Metrics</h2>
                <span className={styles.expandIcon}>{expandedSections.metrics ? '▼' : '▶'}</span>
              </div>
              {expandedSections.metrics && (
                <div className={styles.metricsSection}>
                  <div className={styles.metricsTabs}>
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
                              <td>{formatValue(info[field.key], field.key)}</td>
                            </tr>
                          )
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Chart Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader} onClick={() => toggleSection('chart')}>
                <h2>📈 Price Chart</h2>
                <span className={styles.expandIcon}>{expandedSections.chart ? '▼' : '▶'}</span>
              </div>
              {expandedSections.chart && (
                <div className={styles.chartSection}>
                  <div className={styles.chartControls}>
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
                  <div className={styles.chartContainer}>
                    {selectedChart === 'price' && <PriceChart data={data.historical} />}
                    {selectedChart === 'volume' && (
                      <div className={styles.placeholderChart}>
                        <strong>Volume Chart (Coming Soon)</strong>
                      </div>
                    )}
                    {selectedChart === 'ma' && (
                      <div className={styles.placeholderChart}>
                        <strong>Moving Average Chart (Coming Soon)</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Peer Comparison Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader} onClick={() => toggleSection('peers')}>
                <h2>📈 Peer Comparison</h2>
                <span className={styles.expandIcon}>{expandedSections.peers ? '▼' : '▶'}</span>
              </div>
              {expandedSections.peers && (
                <div className={styles.peersSection}>
                  <div className={styles.placeholderContent}>
                    <p>Peer comparison coming soon:</p>
                    <ul>
                      <li>Compare with similar companies</li>
                      <li>Market cap comparison</li>
                      <li>P/E ratio comparison</li>
                      <li>Performance vs peers</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StockInfo
