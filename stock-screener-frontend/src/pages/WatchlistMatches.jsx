import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import indexedDBService from '../services/indexedDB'
import { stockApi } from '../services/api'
import StockTable from '../components/StockTable'
import styles from './WatchlistMatches.module.css'

const WatchlistMatches = () => {
  const { watchId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [watch, setWatch] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadWatchMatches()
  }, [watchId])

  const loadWatchMatches = async () => {
    try {
      setLoading(true)
      const userWatches = await indexedDBService.getUserWatchlists(user.id)
      const currentWatch = userWatches.find(w => w.id === parseInt(watchId))
      
      if (!currentWatch) {
        setError('Watch not found')
        return
      }
      
      setWatch(currentWatch)
      
      // Run screening to find matches based on watch criteria
      if (currentWatch.criteria && (currentWatch.criteria.fundamental_criteria?.length > 0 || currentWatch.criteria.technical_criteria?.length > 0)) {
        try {
          // Convert array criteria to string format for backend
          const convertCriteriaToString = (criteriaArray) => {
            if (!Array.isArray(criteriaArray) || criteriaArray.length === 0) return '';
            return criteriaArray
              .filter(c => c.field && c.operator && c.value)
              .map(c => `${c.field}${c.operator}${c.value}`)
              .join(',');
          };

          const fundamentalCriteriaStr = convertCriteriaToString(currentWatch.criteria.fundamental_criteria);
          const technicalCriteriaStr = convertCriteriaToString(currentWatch.criteria.technical_criteria);
          
          console.log('Converted criteria strings:');
          console.log('Fundamental:', fundamentalCriteriaStr);
          console.log('Technical:', technicalCriteriaStr);
          
          let screeningResult;
          
          // Use appropriate screening endpoint based on available criteria
          if (fundamentalCriteriaStr && technicalCriteriaStr) {
            // Both criteria exist - use combined screening
            const screeningData = {
              index: currentWatch.index || 'sp500',
              fundamental_criteria: fundamentalCriteriaStr,
              technical_criteria: technicalCriteriaStr,
              limit: 600,
              reload: false,
              period: '1y',
              interval: '1d'
            };
            
            console.log('Running combined screening with data:', screeningData);
            screeningResult = await stockApi.screenStocks(screeningData);
            
          } else if (fundamentalCriteriaStr) {
            // Only fundamental criteria - use fundamental screening
            const screeningData = {
              index: currentWatch.index || 'sp500',
              criteria: fundamentalCriteriaStr,
              limit: 100,
              reload: false,
              period: '1y',
              interval: '1d'
            };
            
            console.log('Running fundamental screening with data:', screeningData);
            screeningResult = await stockApi.screenFundamental(screeningData);
            
          } else if (technicalCriteriaStr) {
            // Only technical criteria - use technical screening
            const screeningData = {
              index: currentWatch.index || 'sp500',
              criteria: technicalCriteriaStr,
              limit: 100,
              reload: false,
              period: '1y',
              interval: '1d'
            };
            
            console.log('Running technical screening with data:', screeningData);
            screeningResult = await stockApi.screenTechnical(screeningData);
          }
          
          console.log('Screening result:', screeningResult);
          
          if (screeningResult && screeningResult.stocks) {
            console.log('Found stocks:', screeningResult.stocks.length);
            setMatches(screeningResult.stocks);
          } else {
            console.log('No stocks in result or result is empty');
            setMatches([]);
          }
        } catch (screeningError) {
          console.error('Error running screening:', screeningError);
          setMatches([]);
        }
      } else {
        console.log('No criteria found in watch:', currentWatch.criteria);
        setMatches([]);
      }
      
    } catch (err) {
      setError('Failed to load watch matches')
      console.error('Error loading matches:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToWatchlists = () => {
    navigate('/watchlist')
  }

  const handleRefresh = () => {
    loadWatchMatches()
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
            <h1>{watch?.name} - Matches</h1>
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