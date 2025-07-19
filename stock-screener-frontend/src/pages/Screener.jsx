import { useState } from 'react'
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
  const [results, setResults] = useState(null);
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
        <ScreenerForm onResults={setResults} />
      </div>
    </div>
  )
}

export default Screener
