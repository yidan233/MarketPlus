import React from 'react'
import styles from './NewsCard.module.css'

const NewsCard = ({ article }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date'
    
    try {
      // Handle Alpha Vantage date format: "20250806T143000"
      const date = new Date(
        dateString.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6')
      )
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Unknown date'
    }
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish':
      case 'somewhat-bullish':
        return styles.bullish
      case 'bearish':
      case 'somewhat-bearish':
        return styles.bearish
      default:
        return styles.neutral
    }
  }

  const getSentimentIcon = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish':
      case 'somewhat-bullish':
        return '📈'
      case 'bearish':
      case 'somewhat-bearish':
        return '📉'
      default:
        return '➡️'
    }
  }

  const handleCardClick = () => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className={styles.newsCard} onClick={handleCardClick}>
      <div className={styles.cardHeader}>
        <div className={styles.sourceInfo}>
          <span className={styles.source}>{article.source}</span>
          <span className={styles.date}>{formatDate(article.published_at)}</span>
        </div>
        <div className={`${styles.sentiment} ${getSentimentColor(article.sentiment)}`}>
          <span className={styles.sentimentIcon}>
            {getSentimentIcon(article.sentiment)}
          </span>
          <span className={styles.sentimentText}>
            {article.sentiment?.replace('-', ' ') || 'Neutral'}
          </span>
        </div>
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.title}>{article.title}</h3>
        <p className={styles.summary}>
          {article.summary?.length > 150 
            ? `${article.summary.substring(0, 150)}...` 
            : article.summary
          }
        </p>
      </div>

      {/* Tickers Section */}
      {article.tickers && article.tickers.length > 0 && (
        <div className={styles.tickersSection}>
          <span className={styles.tickersLabel}>Related:</span>
          <div className={styles.tickersList}>
            {article.tickers.slice(0, 5).map((ticker, index) => (
              <span key={index} className={styles.ticker}>
                {ticker.ticker}
              </span>
            ))}
            {article.tickers.length > 5 && (
              <span className={styles.moreTickers}>
                +{article.tickers.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className={styles.cardFooter}>
        <span className={styles.readMore}>Click to read full article →</span>
      </div>
    </div>
  )
}

export default NewsCard 