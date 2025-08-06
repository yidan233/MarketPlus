import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { watchlistAPI } from '../services/watchlistAPI'
import StockTable from '../components/StockTable'
import styles from './WatchlistMatches.module.css'

const WatchlistMatches = () => {
  const { watchlistId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [watchlist, setWatchlist] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadWatchlistMatches()
  }, [watchlistId])

  const loadWatchlistMatches = async () => {
    try {
      setLoading(true)
      const watchlists = await watchlistAPI.getUserWatchlists(user.username)
      const currentWatchlist = watchlists.find(w => w.id === parseInt(watchlistId))
      
      if (!currentWatchlist) {
        setError('Watchlist not found')
        return
      }
      
      setWatchlist(currentWatchlist)
      
      // Convert matches to stock format for StockTable
      const stockData = (currentWatchlist.matches || []).map(match => ({
        symbol: match.symbol,
        price: match.price,
        market_cap: match.market_cap,
        pe_ratio: match.pe_ratio,
        sector: match.sector,
        name: match.name,
        dividend_yield: match.dividend_yield,
        beta: match.beta,
        industry: match.industry
      }))
      
      setMatches(stockData)
      
    } catch (err) {
      setError('Failed to load watchlist matches')
      console.error('Error loading matches:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToWatchlists = () => {
    navigate('/watchlist')
  }

  const handleRefresh = () => {
    loadWatchlistMatches()
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading matches...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleBackToWatchlists} className={styles.backButton}>
            Back to Watchlists
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button onClick={handleBackToWatchlists} className={styles.backButton}>
            ← Back to Watchlists
          </button>
          <div className={styles.titleSection}>
            <h1>{watchlist?.name} - Matches</h1>
            <p className={styles.subtitle}>
              {matches.length} stocks currently match your criteria
            </p>
          </div>
          <button onClick={handleRefresh} className={styles.refreshButton}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {matches.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📊</div>
            <h3>No matches found</h3>
            <p>No stocks currently match your criteria. Try adjusting your criteria or check back later.</p>
            <button onClick={handleRefresh} className={styles.refreshButton}>
              Check Again
            </button>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <StockTable stocks={matches} loading={false} />
          </div>
        )}
      </div>
    </div>
  )
}

export default WatchlistMatches 