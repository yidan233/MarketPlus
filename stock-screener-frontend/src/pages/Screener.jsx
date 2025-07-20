import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ScreenerForm from '../components/ScreenerForm'
import StockTable from '../components/StockTable'
import styles from './Screener.module.css'

function criteriaToString(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

const Screener = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState(null);
  const [formState, setFormState] = useState({
    index: 'sp500',
    limit: 20,
    fundamental_criteria: [{ field: '', operator: '', value: '' }],
    technical_criteria: [{ field: '', operator: '', value: '' }],
    reload: false,
    period: '1y',
    interval: '1d'
  });
  
  // Load both results and form state from URL on component mount
  useEffect(() => {
    const resultsParam = searchParams.get('results');
    const formStateParam = searchParams.get('formState');
    
    if (resultsParam) {
      try {
        const parsedResults = JSON.parse(decodeURIComponent(resultsParam));
        setResults(parsedResults);
      } catch (e) {
        console.error('Failed to parse results from URL:', e);
      }
    }
    
    if (formStateParam) {
      try {
        const parsedFormState = JSON.parse(decodeURIComponent(formStateParam));
        setFormState(parsedFormState);
      } catch (e) {
        console.error('Failed to parse form state from URL:', e);
      }
    }
  }, [searchParams]);

  // Save results to URL whenever they change
  const handleResultsChange = (newResults) => {
    setResults(newResults);
    if (newResults) {
      const resultsString = encodeURIComponent(JSON.stringify(newResults));
      setSearchParams({ results: resultsString });
    } else {
      setSearchParams({});
    }
  };

  const count = results?.count ?? '-';
  const index = results?.index ?? '-';
  const criteria = results
    ? [
        criteriaToString(results.fundamental_criteria || results.criteria),
        criteriaToString(results.technical_criteria)
      ].filter(Boolean).join(', ')
    : '-';

  return (
    <div className={styles["dashboard-container"]}>
      <div className={styles["dashboard-left"]}>
        <h1 style={{ marginBottom: '1.5rem' }}>Stock Screener</h1>
        <div className={styles["dashboard-summary"]}>
          <div className={styles["summary-card"]}>
            <div>Count</div>
            <div className={styles["summary-value"]}>{count}</div>
          </div>
          <div className={styles["summary-card"]}>
            <div>Index</div>
            <div className={styles["summary-value"]}>{index}</div>
          </div>
          <div className={styles["summary-card"]}>
            <div>Criteria</div>
            <div className={styles["summary-value"]} style={{ fontSize: '1rem', wordBreak: 'break-word' }}>
              {criteria}
            </div>
          </div>
        </div>
        <div style={{ marginTop: '2rem' }}>
          <StockTable stocks={results?.stocks || []} loading={false} />
        </div>
      </div>
      <div className={styles["dashboard-right"]}>
        <ScreenerForm onResults={handleResultsChange} />
      </div>
    </div>
  )
}

export default Screener
