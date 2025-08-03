import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { stockApi } from '../services/api'
import styles from './StockSearch.module.css'

const StockSearch = () => {
  const [searchSymbol, setSearchSymbol] = useState('')
  const [availableSymbols, setAvailableSymbols] = useState([])
  const [selectedIndex, setSelectedIndex] = useState('sp500') 
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  // Available indexes
  const availableIndexes = [
    { value: 'sp500', label: 'S&P 500', description: 'Large-cap US stocks' },
    { value: 'nasdaq100', label: 'NASDAQ 100', description: 'Tech-heavy index' },
    { value: 'dow30', label: 'Dow 30', description: 'Blue-chip companies' }
  ]

  // Load available symbols on component mount and when index changes
  useEffect(() => {
    loadAvailableSymbols()
  }, [selectedIndex])

  const loadAvailableSymbols = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await stockApi.getSymbols(selectedIndex)
      setAvailableSymbols(response.symbols || [])
    } catch (error) {
      console.error('Error loading symbols:', error)
      setError(`Failed to load symbols for ${selectedIndex.toUpperCase()}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchSymbol.trim()) {
      setError('Please enter a stock symbol')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Open stock detail page in a new tab
      const stockUrl = `${window.location.origin}/stock/${searchSymbol.toUpperCase()}`
      window.open(stockUrl, '_blank')
    } catch (error) {
      setError('Failed to search for stock')
    } finally {
      setLoading(false)
    }
  }

  const getRandomStock = () => {
    if (availableSymbols.length === 0) {
      setError('No symbols available')
      return
    }

    const randomIndex = Math.floor(Math.random() * availableSymbols.length)
    const randomSymbol = availableSymbols[randomIndex]
    
    // Open random stock in a new tab
    const stockUrl = `${window.location.origin}/stock/${randomSymbol}`
    window.open(stockUrl, '_blank')
  }

  const handleSymbolClick = (symbol) => {
    // Open stock detail in a new tab
    const stockUrl = `${window.location.origin}/stock/${symbol}`
    window.open(stockUrl, '_blank')
  }

  const handleIndexChange = (newIndex) => {
    setSelectedIndex(newIndex)
    // Symbols will be reloaded via useEffect
  }

  const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX']

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Stock Search</h1>
        <p className={styles.subtitle}>Search for specific stocks or discover random ones</p>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button onClick={() => setError(null)} className={styles.errorClose}>×</button>
        </div>
      )}

      <div className={styles.content}>
  
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Search by Symbol</h2>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.inputGroup}>
              <input
                type="text"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                placeholder="Enter stock symbol (e.g., AAPL, MSFT, GOOGL)"
                className={styles.symbolInput}
                maxLength="10"
              />
              <button 
                type="submit" 
                disabled={loading || !searchSymbol.trim()}
                className={styles.searchButton}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {/* Popular Stocks Section - MOVED UP */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Popular Stocks</h2>
          <p className={styles.sectionDescription}>Quick access to commonly viewed stocks</p>
          <div className={styles.popularStocks}>
            {popularStocks.map((symbol) => (
              <button
                key={symbol}
                onClick={() => handleSymbolClick(symbol)}
                className={styles.popularStockButton}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Index Selection Section - MOVED DOWN */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Select Index</h2>
          <p className={styles.sectionDescription}>
            Choose which index to browse for available symbols
          </p>
          <div className={styles.indexSelector}>
            {availableIndexes.map((index) => (
              <button
                key={index.value}
                onClick={() => handleIndexChange(index.value)}
                className={`${styles.indexButton} ${
                  selectedIndex === index.value ? styles.selectedIndex : ''
                }`}
              >
                <div className={styles.indexLabel}>{index.label}</div>
                <div className={styles.indexDescription}>{index.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Random Stock Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Discover Random Stock from {selectedIndex.toUpperCase()}
          </h2>
          <p className={styles.sectionDescription}>
            Get information about a randomly selected stock from the {selectedIndex.toUpperCase()}
          </p>
          <button 
            onClick={getRandomStock}
            disabled={loading || availableSymbols.length === 0}
            className={styles.randomButton}
          >
            {loading ? 'Loading...' : `Get Random ${selectedIndex.toUpperCase()} Stock`}
          </button>
        </div>

        {/* Available Symbols Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Available Symbols - {selectedIndex.toUpperCase()}
          </h2>
          <p className={styles.sectionDescription}>
            Browse all available stocks from the {selectedIndex.toUpperCase()} ({availableSymbols.length} symbols)
          </p>
          {loading ? (
            <div className={styles.loadingMessage}>Loading symbols...</div>
          ) : (
            <>
              <div className={styles.symbolsGrid}>
                {availableSymbols.slice(0, 50).map((symbol) => (
                  <button
                    key={symbol}
                    onClick={() => handleSymbolClick(symbol)}
                    className={styles.symbolButton}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
              {availableSymbols.length > 50 && (
                <p className={styles.symbolsNote}>
                  Showing first 50 symbols. Use search for specific stocks.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default StockSearch 