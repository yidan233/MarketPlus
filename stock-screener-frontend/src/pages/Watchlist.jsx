import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { stockApi } from '../services/api'
import WatchlistForm from '../components/WatchlistForm'
import WatchlistTable from '../components/WatchlistTable'
import indexedDBService from '../services/indexedDB'
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
      // Load from IndexedDB instead of localStorage
      const userWatches = await indexedDBService.getUserWatchlists(user.id)
      setWatches(userWatches)
    } catch (error) {
      console.error('Failed to load watchlist:', error)
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
        userId: user.id,
        name: watchData.name,
        criteria: {  // ← Ensure proper structure
          fundamental_criteria: watchData.criteria?.fundamental_criteria || [],
          technical_criteria: watchData.criteria?.technical_criteria || []
        },
        emailAlerts: watchData.emailAlerts,
        alertFrequency: watchData.alertFrequency,
        index: watchData.index,
        lastChecked: null,
        matches: [],
        isActive: true
      }
      
      // Debug log to see what we're creating
      console.log('Created newWatch:', newWatch)

      // Save to IndexedDB
      const savedWatch = await indexedDBService.addWatchlist(newWatch)
      
      // Update local state
      setWatches(prev => [...prev, savedWatch])
      
      setActiveTab('watches')
    } catch (error) {
      console.error('Failed to create watch:', error)
      setError('Failed to create watch')
    } finally {
      setLoading(false)
    }
  }

  const deleteWatch = async (watchId) => {
    try {
      // Delete from IndexedDB
      await indexedDBService.deleteWatchlist(watchId)
      
      // Update local state
      setWatches(prev => prev.filter(watch => watch.id !== watchId))
    } catch (error) {
      console.error('Failed to delete watch:', error)
      setError('Failed to delete watch')
    }
  }

  const toggleWatch = async (watchId) => {
    try {
      const watchToUpdate = watches.find(w => w.id === watchId)
      if (!watchToUpdate) return

      const updatedWatch = { ...watchToUpdate, isActive: !watchToUpdate.isActive }
      
      // Update in IndexedDB
      await indexedDBService.updateWatchlist(watchId, { isActive: updatedWatch.isActive })
      
      // Update local state
      setWatches(prev => prev.map(watch => 
        watch.id === watchId ? updatedWatch : watch
      ))
    } catch (error) {
      console.error('Failed to update watch:', error)
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