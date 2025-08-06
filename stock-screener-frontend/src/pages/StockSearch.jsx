import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { stockApi } from '../services/api'
import styles from './StockSearch.module.css'

const StockSearch = () => {
  const [searchSymbol, setSearchSymbol] = useState('')
  const [availableSymbols, setAvailableSymbols] = useState([])
  const [selectedIndex, setSelectedIndex] = useState('sp500')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const [randomCount, setRandomCount] = useState(0)
  const navigate = useNavigate()
  const searchInputRef = useRef(null)

  // Available indexes with enhanced descriptions
  const availableIndexes = [
    { 
      value: 'sp500', 
      label: 'S&P 500', 
      description: 'Large-cap US stocks',
      icon: '📈',
      category: 'US Large Cap'
    },
    { 
      value: 'nasdaq100', 
      label: 'NASDAQ 100', 
      description: 'Tech-heavy index',
      icon: '💻',
      category: 'Technology'
    },
    { 
      value: 'dow30', 
      label: 'Dow 30', 
      description: 'Blue-chip companies',
      icon: '🏢',
      category: 'Blue Chip'
    }
  ]

  // Category-based exploration
  const stockCategories = [
    { name: 'Tech Titans', icon: '🚀', symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA'] },
    { name: 'Clean Energy', icon: '🌱', symbols: ['TSLA', 'NIO', 'PLUG', 'ENPH', 'RUN', 'SEDG'] },
    { name: 'Banking Giants', icon: '🏦', symbols: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C'] },
    { name: 'Healthcare', icon: '⚕️', symbols: ['JNJ', 'PFE', 'UNH', 'ABBV', 'TMO', 'DHR'] },
    { name: 'Consumer Goods', icon: '🛍️', symbols: ['PG', 'KO', 'PEP', 'WMT', 'HD', 'MCD'] },
    { name: 'Entertainment', icon: '🎬', symbols: ['NFLX', 'DIS', 'SPOT', 'ROKU', 'CMCSA', 'VIAC'] }
  ]

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Load available symbols on component mount and when index changes
  useEffect(() => {
    loadAvailableSymbols()
  }, [selectedIndex])

  // Keyboard shortcut for search focus
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

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

  // Debounced search suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchSymbol.length >= 2) {
        generateSuggestions(searchSymbol)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchSymbol, availableSymbols])

  const generateSuggestions = (query) => {
    const filtered = availableSymbols
      .filter(symbol => symbol.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8)
    
    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
  }

  const addToRecentSearches = (symbol) => {
    const updated = [symbol, ...recentSearches.filter(s => s !== symbol)].slice(0, 8)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
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
      addToRecentSearches(searchSymbol.toUpperCase())
      
      // Open stock detail page in a new tab
      const stockUrl = `${window.location.origin}/stock/${searchSymbol.toUpperCase()}`
      window.open(stockUrl, '_blank')
    } catch (error) {
      setError('Failed to search for stock')
    } finally {
      setLoading(false)
      setShowSuggestions(false)
    }
  }

  const getRandomStock = () => {
    if (availableSymbols.length === 0) {
      setError('No symbols available')
      return
    }

    const randomIndex = Math.floor(Math.random() * availableSymbols.length)
    const randomSymbol = availableSymbols[randomIndex]
    
    setRandomCount(prev => prev + 1)
    addToRecentSearches(randomSymbol)
    
    // Open random stock in a new tab
    const stockUrl = `${window.location.origin}/stock/${randomSymbol}`
    window.open(stockUrl, '_blank')
  }

  const handleSymbolClick = (symbol) => {
    addToRecentSearches(symbol)
    // Open stock detail in a new tab
    const stockUrl = `${window.location.origin}/stock/${symbol}`
    window.open(stockUrl, '_blank')
  }

  const handleSuggestionClick = (suggestion) => {
    setSearchSymbol(suggestion)
    setShowSuggestions(false)
    handleSymbolClick(suggestion)
  }

  const handleIndexChange = (newIndex) => {
    setSelectedIndex(newIndex)
    // Symbols will be reloaded via useEffect
  }

  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
    { symbol: 'NFLX', name: 'Netflix Inc.' }
  ]

  const getRandomMessage = () => {
    if (randomCount >= 5) return "🎯 Feeling lucky? Let's discover an underdog!"
    if (randomCount >= 3) return "🎯 Getting adventurous with your picks!"
    return "🎲 Discover a random stock from the index"
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🔍 Stock Search</h1>
        <p className={styles.subtitle}>Search for specific stocks or discover random ones</p>
        <div className={styles.keyboardHint}>
          💡 Press <kbd>Ctrl+K</kbd> to focus search
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button onClick={() => setError(null)} className={styles.errorClose}>×</button>
        </div>
      )}

      <div className={styles.content}>
        {/* Enhanced Search Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🔍 Search by Symbol</h2>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.inputGroup}>
              <div className={styles.searchInputContainer}>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchSymbol}
                  onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Enter stock symbol (e.g., AAPL, MSFT, GOOGL)"
                  className={styles.symbolInput}
                  maxLength="10"
                />
                {showSuggestions && (
                  <div className={styles.suggestionsDropdown}>
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion}
                        className={styles.suggestionItem}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                disabled={loading || !searchSymbol.trim()}
                className={styles.searchButton}
              >
                {loading ? 'Searching...' : '🔍 Search'}
              </button>
              <button 
                type="button"
                onClick={getRandomStock}
                disabled={loading || availableSymbols.length === 0}
                className={styles.randomButton}
                title="Explore a random company you might not know"
              >
                🎲 Random
              </button>
            </div>
          </form>
        </div>

        {/* Recent Searches Section */}
        {recentSearches.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🔙 Recently Viewed</h2>
            <div className={styles.recentSearches}>
              {recentSearches.map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => handleSymbolClick(symbol)}
                  className={styles.recentSearchButton}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular Stocks Section with Enhanced Cards */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>⭐ Popular Stocks</h2>
          <p className={styles.sectionDescription}>Quick access to commonly viewed stocks</p>
          <div className={styles.popularStocksGrid}>
            {popularStocks.map((stock) => (
              <div
                key={stock.symbol}
                className={styles.stockCard}
                onClick={() => handleSymbolClick(stock.symbol)}
              >
                <div className={styles.stockCardHeader}>
                  <div className={styles.stockSymbol}>{stock.symbol}</div>
                  <div className={styles.stockName}>{stock.name}</div>
                </div>
                <div className={styles.stockCardPreview}>
                  <div className={styles.previewPlaceholder}>
                    💹 Click to view details
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category-Based Exploration */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📂 Explore by Category</h2>
          <p className={styles.sectionDescription}>Discover stocks by sector and theme</p>
          <div className={styles.categoriesGrid}>
            {stockCategories.map((category) => (
              <div key={category.name} className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryIcon}>{category.icon}</span>
                  <h3 className={styles.categoryName}>{category.name}</h3>
                </div>
                <div className={styles.categorySymbols}>
                  {category.symbols.map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => handleSymbolClick(symbol)}
                      className={styles.categorySymbolButton}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Index Selection */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🔄 Select Index</h2>
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
                <div className={styles.indexIcon}>{index.icon}</div>
                <div className={styles.indexContent}>
                  <div className={styles.indexLabel}>{index.label}</div>
                  <div className={styles.indexDescription}>{index.description}</div>
                  <div className={styles.indexCategory}>{index.category}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Random Stock Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            🎲 Discover Random Stock from {selectedIndex.toUpperCase()}
          </h2>
          <p className={styles.sectionDescription}>
            {getRandomMessage()}
          </p>
          <button 
            onClick={getRandomStock}
            disabled={loading || availableSymbols.length === 0}
            className={styles.randomButtonLarge}
          >
            {loading ? 'Loading...' : `🎲 Get Random ${selectedIndex.toUpperCase()} Stock`}
          </button>
        </div>

        {/* Available Symbols Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            📋 Available Symbols - {selectedIndex.toUpperCase()}
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