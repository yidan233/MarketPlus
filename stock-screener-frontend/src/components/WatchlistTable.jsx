import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './WatchlistTable.module.css'

const WatchlistTable = ({ watches, onDelete, onToggle, loading, onSwitchToForm }) => {
  const navigate = useNavigate()

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getCriteriaSummary = (criteria) => {
    if (!criteria) {
      return 'no criteria'
    }
    
    // Handle different possible structures
    let fundamental = []
    let technical = []
    
    if (criteria.fundamental_criteria && Array.isArray(criteria.fundamental_criteria)) {
      fundamental = criteria.fundamental_criteria
    }
    
    if (criteria.technical_criteria && Array.isArray(criteria.technical_criteria)) {
      technical = criteria.technical_criteria
    }
    
    const fundamentalCount = fundamental.filter(c => c.field && c.operator && c.value).length
    const technicalCount = technical.filter(c => c.field && c.operator && c.value).length
    
    return `${fundamentalCount} fundamental, ${technicalCount} technical`
  }

  const handleViewMatches = (watch) => {
    // Navigate to screener with watch criteria when button is clicked 
    // think we need to automatically filled in the criteria perhaps?
    const criteriaString = [...(watch.criteria?.fundamental_criteria || []), ...(watch.criteria?.technical_criteria || [])]
      .filter(c => c.field && c.operator && c.value)
      .map(c => `${c.field}${c.operator}${c.value}`)
      .join(',')
    
    navigate(`/watchlist/matches/${watch.id}`)
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingMessage}>Loading your watches...</div>
      </div>
    )
  }

  if (watches.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⭐</div>
        <h3>No watches yet</h3>
        <p>Create your first watch to start monitoring stocks that match your criteria.</p>
        <button 
          onClick={onSwitchToForm}
          className={styles.createButton}
        >
          Create Your First Watch
        </button>
      </div>
    )
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h3>Your Active Watches</h3>
        <p>Manage your stock monitoring criteria and alerts</p>
      </div>

      <div className={styles.watchesGrid}>
        {watches.map((watch) => (
          <div key={watch.id} className={styles.watchCard}>
            <div className={styles.watchHeader}>
              <div className={styles.watchInfo}>
                <h4 className={styles.watchName}>{watch.name}</h4>
                <span className={styles.watchIndex}>{watch.index?.toUpperCase() || 'N/A'}</span>
              </div>
              <div className={styles.watchActions}>
                <button
                  onClick={() => onDelete(watch.id)}
                  className={styles.deleteButton}
                  title="Delete watch"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className={styles.watchDetails}>
              <div className={styles.criteriaInfo}>
                <span className={styles.criteriaLabel}>Criteria:</span>
                <span className={styles.criteriaText}>
                  {getCriteriaSummary(watch.criteria)}
                </span>
              </div>

              <div className={styles.alertInfo}>
                <span className={styles.alertLabel}>Alerts:</span>
                <span className={styles.alertText}>
                  {watch.emailAlerts ? `Email (${watch.alertFrequency || 'unknown'})` : 'Disabled'}
                </span>
              </div>

              <div className={styles.dateInfo}>
                <span className={styles.dateLabel}>Created:</span>
                <span className={styles.dateText}>{watch.created ? formatDate(watch.created) : 'Unknown'}</span>
              </div>

              {watch.lastChecked && (
                <div className={styles.dateInfo}>
                  <span className={styles.dateLabel}>Last Checked:</span>
                  <span className={styles.dateText}>{formatDate(watch.lastChecked)}</span>
                </div>
              )}
            </div>

            <div className={styles.watchActions}>
              <button
                onClick={() => handleViewMatches(watch)}
                className={styles.viewButton}
              >
                🔍 View Matches
              </button>
              
              {watch.matches && watch.matches.length > 0 && (
                <span className={styles.matchCount}>
                  {watch.matches.length} matches
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default WatchlistTable 