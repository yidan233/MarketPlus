import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ScreenerForm from '../components/ScreenerForm'
import StockTable from '../components/StockTable'
import styles from './Screener.module.css'
// Remove: import indexedDBService from '../services/indexedDB'

function criteriaToString(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

// Simple hash function
const generateHash = (data) => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36); // Convert to base36 for shorter strings
};

const Screener = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState(null);
  const [formState, setFormState] = useState({
    index: 'sp500',
    fundamental_criteria: [{ field: '', operator: '', value: '' }],
    technical_criteria: [{ field: '', operator: '', value: '' }],
    reload: false,
    period: '1y',
    interval: '1d'
  });
  
  // Load state from hash on component mount
  useEffect(() => {
    const resultsHash = searchParams.get('r'); // 'r' for results
    const formHash = searchParams.get('f');    // 'f' for form
    
    if (resultsHash) {
      const storedResults = localStorage.getItem(`results_${resultsHash}`);
      if (storedResults) {
        setResults(JSON.parse(storedResults));
      }
    }
    
    if (formHash) {
      const storedFormState = localStorage.getItem(`form_${formHash}`);
      if (storedFormState) {
        setFormState(JSON.parse(storedFormState));
      }
    }
  }, [searchParams]);

  // Save results with hash
  const handleResultsChange = (newResults) => {
    setResults(newResults);
    
    if (newResults) {
      const resultsHash = generateHash(newResults);
      localStorage.setItem(`results_${resultsHash}`, JSON.stringify(newResults));
      
      // Store only the hash in URL
      setSearchParams(prev => ({
        ...prev,
        r: resultsHash
      }));
    } else {
      setSearchParams(prev => {
        const newParams = { ...prev };
        delete newParams.r;
        return newParams;
      });
    }
  };

  // Save form state with hash
  const handleFormStateChange = (newFormState) => {
    setFormState(newFormState);
    
    const formHash = generateHash(newFormState);
    localStorage.setItem(`form_${formHash}`, JSON.stringify(newFormState));
    
    // Store only the hash in URL
    setSearchParams(prev => ({
      ...prev,
      f: formHash
    }));
  };

  const count = results?.count ?? '-';
  const index = results?.index ?? '-';

  return (
    <div className={styles["dashboard-container"]}>
      <div className={styles["dashboard-left"]}>
        <h1 style={{ marginBottom: '1rem' }}>Stock Screener</h1>
        
        {/* Inline Summary Cards */}
        <div className={styles["dashboard-summary"]} style={{ marginBottom: '1rem' }}>
          <div className={styles["summary-card"]}>
            <span>Total: </span>
            <span className={styles["summary-value"]}>{count}</span>
          </div>
          <div className={styles["summary-card"]}>
            <span>Index: </span>
            <span className={styles["summary-value"]}>{index}</span>
          </div>
        </div>
        
        {/* Stock Table with more space */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <StockTable stocks={results?.stocks || []} loading={false} />
        </div>
      </div>
      <div className={styles["dashboard-right"]}>
        <ScreenerForm 
          onResults={handleResultsChange}
          onFormStateChange={handleFormStateChange}
          initialFormState={formState}
        />
      </div>
    </div>
  )
}

export default Screener
