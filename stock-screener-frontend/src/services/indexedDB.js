// IndexedDB Database Service
// Stores only important, persistent user data

const DB_NAME = 'StockScreenerDB';
const DB_VERSION = 21; 


const STORES = {
  USERS: 'users',
  WATCHLISTS: 'watchlists'
};

class IndexedDBService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  // Initialize the database
  async init() {
    if (this.isInitialized) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion;

        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

        // Create users store if it doesn't exist
        if (!db.objectStoreNames.contains(STORES.USERS)) {
          const userStore = db.createObjectStore(STORES.USERS, { keyPath: 'id' });
          userStore.createIndex('username', 'username', { unique: true });
          userStore.createIndex('email', 'email', { unique: true });
          
          // Add demo user only if this is a fresh database
          if (oldVersion === 0) {
            const demoUser = {
              id: 1,
              username: 'demo',
              email: 'demo@example.com',
              password: 'demo123', // In real app, this would be hashed
              createdAt: new Date().toISOString()
            };
            userStore.add(demoUser);
          }
        }

        // Create watchlists store if it doesn't exist
        if (!db.objectStoreNames.contains(STORES.WATCHLISTS)) {
          const watchlistStore = db.createObjectStore(STORES.WATCHLISTS, { keyPath: 'id', autoIncrement: true });
          watchlistStore.createIndex('userId', 'userId', { unique: false });
        }

        // Remove old cache stores if they exist (migrating from previous version)
        if (db.objectStoreNames.contains('search_cache')) {
          db.deleteObjectStore('search_cache');
        }
        if (db.objectStoreNames.contains('form_states')) {
          db.deleteObjectStore('form_states');
        }
      };
    });
  }

  // Generic method to get object store
  getStore(storeName, mode = 'readonly') {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // User Management Methods
  async getAllUsers() {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.USERS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async findUserByCredentials(username, password) {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.USERS);
      const request = store.getAll();

      request.onsuccess = () => {
        const user = request.result.find(u => 
          u.username === username && u.password === password
        );
        resolve(user || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async findUserByUsernameOrEmail(username, email) {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.USERS);
      const request = store.getAll();

      request.onsuccess = () => {
        const user = request.result.find(u => 
          u.username === username || u.email === email
        );
        resolve(user || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addUser(userData) {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.USERS, 'readwrite');
      
      const newUser = {
        id: Date.now(),
        username: userData.username,
        email: userData.email,
        password: userData.password,
        createdAt: new Date().toISOString()
      };

      const request = store.add(newUser);

      request.onsuccess = () => resolve(newUser);
      request.onerror = () => reject(request.error);
    });
  }

  async updateUser(userId, updates) {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.USERS, 'readwrite');
      
      // First get the user
      const getRequest = store.get(userId);
      
      getRequest.onsuccess = () => {
        const user = getRequest.result;
        if (!user) {
          reject(new Error('User not found'));
          return;
        }

        const updatedUser = { ...user, ...updates };
        const updateRequest = store.put(updatedUser);
        
        updateRequest.onsuccess = () => resolve(updatedUser);
        updateRequest.onerror = () => reject(updateRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteUser(userId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.USERS, 'readwrite');
      const request = store.delete(userId);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // Watchlist Methods
  async getUserWatchlists(userId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.WATCHLISTS);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addWatchlist(watchlistData) {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.WATCHLISTS, 'readwrite');
      
      const newWatchlist = {
        ...watchlistData,
        createdAt: new Date().toISOString()
      };

      const request = store.add(newWatchlist);

      request.onsuccess = () => resolve({ ...newWatchlist, id: request.result });
      request.onerror = () => reject(request.error);
    });
  }

  async updateWatchlist(watchlistId, updates) {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.WATCHLISTS, 'readwrite');
      
      const getRequest = store.get(watchlistId);
      
      getRequest.onsuccess = () => {
        const watchlist = getRequest.result;
        if (!watchlist) {
          reject(new Error('Watchlist not found'));
          return;
        }

        const updatedWatchlist = { ...watchlist, ...updates };
        const updateRequest = store.put(updatedWatchlist);
        
        updateRequest.onsuccess = () => resolve(updatedWatchlist);
        updateRequest.onerror = () => reject(updateRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteWatchlist(watchlistId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.WATCHLISTS, 'readwrite');
      const request = store.delete(watchlistId);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // Method to delete the entire database (for testing/reset)
  async deleteDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      
      request.onsuccess = () => {
        this.db = null;
        this.isInitialized = false;
        console.log('Database deleted successfully');
        resolve();
      };
      
      request.onerror = () => {
        console.error('Failed to delete database:', request.error);
        reject(request.error);
      };
    });
  }
}

// Create and export a singleton instance
const indexedDBService = new IndexedDBService();
export default indexedDBService; 