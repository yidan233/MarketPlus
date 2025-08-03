import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "./Sidebar.module.css";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const handleAuthClick = (path) => {
    navigate(path);
    onClose();
  };

  if (loading) {
    return (
      <>
        <div
          className={`${styles["sidebar-overlay"]} ${isOpen ? styles.open : ""}`}
          onClick={onClose}
        />
        <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
          <div className={styles["sidebar-header"]}>
            <span>Loading...</span>
            <button className={styles["close-button"]} onClick={onClose}>
              ×
            </button>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      <div
        className={`${styles["sidebar-overlay"]} ${isOpen ? styles.open : ""}`}
        onClick={onClose}
      />
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles["sidebar-header"]}>
          <span>Menu</span>
          <button className={styles["close-button"]} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles["sidebar-content"]}>
          {/* User Section */}
          <div className={styles["sidebar-section"]}>
            {user ? (
              <div className={styles["user-info"]}>
                <div className={styles["user-avatar"]}>
                  <span>{user.username.charAt(0).toUpperCase()}</span>
                </div>
                <div className={styles["user-details"]}>
                  <p>Welcome, {user.username}!</p>
                  <p>{user.email}</p>
                  <button 
                    className={styles["logout-button"]} 
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles["auth-section"]}>
                <h3>Welcome to Stock Screener</h3>
                <p>Sign in to access additional features</p>
                <div className={styles["auth-buttons"]}>
                  <button 
                    className={styles["auth-button"]}
                    onClick={() => handleAuthClick('/login')}
                  >
                    Sign In
                  </button>
                  <button 
                    className={`${styles["auth-button"]} ${styles["secondary"]}`}
                    onClick={() => handleAuthClick('/signup')}
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Section */}
          <div className={styles["sidebar-section"]}>
            <h3>Navigation</h3>
            <nav className={styles["sidebar-nav"]}>
              <button 
                className={styles["nav-item"]}
                onClick={() => {
                  navigate('/');
                  onClose();
                }}
              >
                <span className={styles["nav-icon"]}>📊</span>
                Stock Screener
              </button>
              <button 
                className={styles["nav-item"]}
                onClick={() => {
                  navigate('/stock-search');
                  onClose();
                }}
              >
                <span className={styles["nav-icon"]}>🔍</span>
                Stock Search
              </button>
              <button className={`${styles["nav-item"]} ${styles.disabled}`}>
                <span className={styles["nav-icon"]}>⭐</span>
                Watchlist
                <span className={styles["coming-soon"]}>Coming Soon</span>
              </button>
              <button className={`${styles["nav-item"]} ${styles.disabled}`}>
                <span className={styles["nav-icon"]}>📈</span>
                Portfolio
                <span className={styles["coming-soon"]}>Coming Soon</span>
              </button>
              <button className={`${styles["nav-item"]} ${styles.disabled}`}>
                <span className={styles["nav-icon"]}>⚙️</span>
                Settings
                <span className={styles["coming-soon"]}>Coming Soon</span>
              </button>
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 