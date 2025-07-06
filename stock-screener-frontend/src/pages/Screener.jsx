import { useState } from 'react'
import ScreenerForm from '../components/ScreenerForm'
import StockTable from '../components/StockTable'

function criteriaToString(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

const Screener = () => {
  const [results, setResults] = useState(null)
  
  // TO DO -> other design or better criteria ? 
  const count = results?.count ?? '-'
  const index = results?.index ?? '-'
  const criteria = results
    ? [
        criteriaToString(results.fundamental_criteria || results.criteria),
        criteriaToString(results.technical_criteria)
      ].filter(Boolean).join(', ')
    : '-'

  return (
    <div className="dashboard-container">
      <div className="dashboard-left">
        <h1 style={{ marginBottom: '1.5rem' }}>Stock Screener</h1>
        <div className="dashboard-summary">
          <div className="summary-card">
            <div>Count</div>
            <div className="summary-value">{count}</div>
          </div>
          <div className="summary-card">
            <div>Index</div>
            <div className="summary-value">{index}</div>
          </div>
          <div className="summary-card">
            <div>Criteria</div>
            <div className="summary-value" style={{ fontSize: '1rem', wordBreak: 'break-word' }}>
              {criteria}
            </div>
          </div>
        </div>
        <div style={{ marginTop: '2rem' }}>
          <StockTable stocks={results?.stocks || []} loading={false} />
        </div>
      </div>
      <div className="dashboard-right">
        <ScreenerForm onResults={setResults} />
      </div>
    </div>
  )
}

export default Screener
