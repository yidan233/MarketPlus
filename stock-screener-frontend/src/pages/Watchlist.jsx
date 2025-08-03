import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { stockApi } from '../services/api'
import WatchlistForm from '../components/WatchlistForm'
import WatchlistTable from '../components/WatchlistTable'
import styles from './Watchlist.module.css'

const Watchlist = () => {
  const { user } = useAuth()
  const [watches, setWatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('watches') // 'watches' or 'setup'

  // Load user's watches on component mount
  useEffect(() => {
    if (user) {
      loadUserWatches()
    }
  }, [user])

  const loadUserWatches = async () => {
    try {
      setLoading(true)
      // This would be an API call to get user's watches
      const userWatches = JSON.parse(localStorage.getItem(`watchlist_${user.id}`) || '[]')
      setWatches(userWatches)
    } catch (error) {
      setError('Failed to load watchlist')
    } finally {
      setLoading(false)
    }
  }

  const addWatch = async (watchData) => {
    try {
      setLoading(true)
      
      // Debug log to see what we're receiving
      console.log('Received watchData:', watchData)
      
      const newWatch = {
        id: Date.now(),
        name: watchData.name,
        criteria: {  // ← Ensure proper structure
          fundamental_criteria: watchData.criteria?.fundamental_criteria || [],
          technical_criteria: watchData.criteria?.technical_criteria || []
        },
        emailAlerts: watchData.emailAlerts,
        alertFrequency: watchData.alertFrequency,
        index: watchData.index,
        created: new Date().toISOString(),
        lastChecked: null,
        matches: [],
        isActive: true
      }
      
      // Debug log to see what we're creating
      console.log('Created newWatch:', newWatch)

      const updatedWatches = [...watches, newWatch]
      setWatches(updatedWatches)
      
      // Save to localStorage
      localStorage.setItem(`watchlist_${user.id}`, JSON.stringify(updatedWatches))
      
      setActiveTab('watches')
    } catch (error) {
      setError('Failed to create watch')
    } finally {
      setLoading(false)
    }
  }

  const deleteWatch = async (watchId) => {
    try {
      const updatedWatches = watches.filter(watch => watch.id !== watchId)
      setWatches(updatedWatches)
      localStorage.setItem(`watchlist_${user.id}`, JSON.stringify(updatedWatches))
    } catch (error) {
      setError('Failed to delete watch')
    }
  }

  const toggleWatch = async (watchId) => {
    try {
      const updatedWatches = watches.map(watch => 
        watch.id === watchId 
          ? { ...watch, isActive: !watch.isActive }
          : watch
      )
      setWatches(updatedWatches)
      localStorage.setItem(`watchlist_${user.id}`, JSON.stringify(updatedWatches))
    } catch (error) {
      setError('Failed to update watch')
    }
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.authMessage}>
          <h2>Sign in to access your watchlist</h2>
          <p>Create personalized stock watches and get email alerts when stocks match your criteria.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Watchlist</h1>
        <p className={styles.subtitle}>Monitor stocks and get alerts when they match your criteria</p>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button onClick={() => setError(null)} className={styles.errorClose}>×</button>
        </div>
      )}

      <div className={styles.tabContainer}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'watches' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('watches')}
          >
            📊 Active Watches ({watches.length})
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'setup' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('setup')}
          >
            ➕ Create New Watch
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'watches' && (
            <WatchlistTable 
              watches={watches}
              onDelete={deleteWatch}
              onToggle={toggleWatch}
              loading={loading}
              onSwitchToForm={() => setActiveTab('setup')}
            />
          )}
          
          {activeTab === 'setup' && (
            <WatchlistForm 
              onSubmit={addWatch}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Watchlist 