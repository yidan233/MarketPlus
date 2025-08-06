const API_BASE = 'http://localhost:5000/api';

export const watchlistAPI = {
  async getUserWatchlists(username) {
    try {
      const response = await fetch(`${API_BASE}/watchlists/?username=${encodeURIComponent(username)}`);  // Add trailing slash
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch watchlists:', error);
      throw error;
    }
  },

  async createWatchlist(watchlistData) {
    try {
      const response = await fetch(`${API_BASE}/watchlists/`, {  // Add trailing slash
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(watchlistData)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to create watchlist:', error);
      throw error;
    }
  },

  async updateWatchlist(watchlistId, updates) {
    try {
      const response = await fetch(`${API_BASE}/watchlists/${watchlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to update watchlist:', error);
      throw error;
    }
  },

  async deleteWatchlist(watchlistId) {
    try {
      const response = await fetch(`${API_BASE}/watchlists/${watchlistId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to delete watchlist:', error);
      throw error;
    }
  },

  async getWatchlistMatches(watchlistId) {
    try {
      const response = await fetch(`${API_BASE}/watchlists/${watchlistId}/matches`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch watchlist matches:', error);
      throw error;
    }
  },

  async deleteMatch(watchlistId, matchId) {
    try {
      const response = await fetch(`${API_BASE}/watchlists/${watchlistId}/matches/${matchId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to delete match:', error);
      throw error;
    }
  },

  async clearWatchlistMatches(watchlistId) {
    try {
      const response = await fetch(`${API_BASE}/watchlists/${watchlistId}/matches`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to clear matches:', error);
      throw error;
    }
  }
}; 