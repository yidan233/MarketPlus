import React, { useState, useEffect } from 'react'
import { newsApi } from '../services/api'
import NewsCard from '../components/NewsCard'
import styles from './News.module.css'

const News = () => {
  const [activeTab, setActiveTab] = useState('market') // 'market' or 'headlines'
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadNews()
  }, [activeTab])

  const loadNews = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let response
      switch (activeTab) {
        case 'market':
          response = await newsApi.getMarketNews(15)
          break
        case 'headlines':
          response = await newsApi.getTopHeadlines(15)
          break
        default:
          response = await newsApi.getMarketNews(15)
      }
      
      if (response.success) {
        setNews(response.news || [])
      } else {
        setError(response.error || 'Failed to load news')
      }
    } catch (error) {
      console.error('Error loading news:', error)
      setError(error.response?.data?.error || 'Failed to load news. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  if (loading && news.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading news...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Financial News</h1>
        <p>Stay updated with the latest market news and company updates</p>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'market' ? styles.active : ''}`}
          onClick={() => handleTabChange('market')}
        >
          📈 Market News
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'headlines' ? styles.active : ''}`}
          onClick={() => handleTabChange('headlines')}
        >
          🚨 Top Headlines
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      )}

      {/* News Grid */}
      <div className={styles.newsGrid}>
        {news.map((article, index) => (
          <NewsCard key={index} article={article} />
        ))}
      </div>

      {/* Loading More Indicator */}
      {loading && news.length > 0 && (
        <div className={styles.loadingMore}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading more news...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && news.length === 0 && !error && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📰</div>
          <h3>No news available</h3>
          <p>Try switching to a different category.</p>
        </div>
      )}
    </div>
  )
}

export default News 