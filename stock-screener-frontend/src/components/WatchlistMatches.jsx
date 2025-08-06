import React, { useState, useEffect } from 'react';
import { watchlistAPI } from '../services/watchlistAPI';
import styles from './WatchlistMatches.module.css';

const WatchlistMatches = ({ watchlist, onRefresh }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (watchlist) {
      loadMatches();
    }
  }, [watchlist]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await watchlistAPI.getWatchlistMatches(watchlist.id);
      setMatches(data);
    } catch (error) {
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const deleteMatch = async (matchId) => {
    try {
      await watchlistAPI.deleteMatch(watchlist.id, matchId);
      setMatches(prev => prev.filter(match => match.id !== matchId));
    } catch (error) {
      setError('Failed to delete match');
    }
  };

  const clearAllMatches = async () => {
    try {
      await watchlistAPI.clearWatchlistMatches(watchlist.id);
      setMatches([]);
    } catch (error) {
      setError('Failed to clear matches');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading matches...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Matches for "{watchlist.name}"</h3>
        <div className={styles.actions}>
          <button onClick={loadMatches} className={styles.refreshButton}>
            Refresh
          </button>
          {matches.length > 0 && (
            <button onClick={clearAllMatches} className={styles.clearButton}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {matches.length === 0 ? (
        <div className={styles.noMatches}>
          <p>No matches found yet. The system checks every 15 minutes.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.matchesTable}>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Sector</th>
                <th>Price</th>
                <th>Matched At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {matches.map(match => (
                <tr key={match.id}>
                  <td className={styles.symbol}>{match.symbol}</td>
                  <td>{match.name}</td>
                  <td>{match.sector}</td>
                  <td className={styles.price}>${match.price?.toFixed(2) || 'N/A'}</td>
                  <td className={styles.date}>
                    {new Date(match.matched_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button 
                      onClick={() => deleteMatch(match.id)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WatchlistMatches; 