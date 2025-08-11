import { useState } from 'react'
import styles from './CriteriaBuilder.module.css'
const FUNDAMENTAL_FIELDS = [
  // Valuation Metrics
  { value: 'market_cap', label: 'Market Cap' },
  { value: 'price', label: 'Current Price' },
  { value: 'pe_ratio', label: 'P/E Ratio (Trailing)' },
  { value: 'forward_pe', label: 'P/E Ratio (Forward)' },
  { value: 'price_to_book', label: 'Price to Book' },
  { value: 'price_to_sales', label: 'Price to Sales' },
  { value: 'enterprise_to_revenue', label: 'Enterprise to Revenue' },
  { value: 'enterprise_to_ebitda', label: 'Enterprise to EBITDA' },
  
  // Dividend Metrics
  { value: 'dividend_yield', label: 'Dividend Yield' },
  { value: 'payout_ratio', label: 'Payout Ratio' },
  
  // Profitability Metrics
  { value: 'profit_margin', label: 'Profit Margin' },
  { value: 'operating_margin', label: 'Operating Margin' },
  { value: 'return_on_equity', label: 'Return on Equity (ROE)' },
  { value: 'return_on_assets', label: 'Return on Assets (ROA)' },
  
  // Growth Metrics
  { value: 'revenue_growth', label: 'Revenue Growth' },
  { value: 'earnings_growth', label: 'Earnings Growth' },
  
  // Risk Metrics
  { value: 'beta', label: 'Beta' },
  { value: 'current_ratio', label: 'Current Ratio' },
  { value: 'debt_to_equity', label: 'Debt to Equity' },
  
  // Categorical Fields
  { value: 'sector', label: 'Sector' },
  { value: 'industry', label: 'Industry' },
  { value: 'country', label: 'Country' },
]

const TECHNICAL_FIELDS = [
  { value: 'rsi', label: 'RSI' },
  { value: 'ma', label: 'Moving Average' },
  { value: 'ema', label: 'Exponential Moving Average' },
  { value: 'macd_hist', label: 'MACD Histogram' },
  { value: 'boll_upper', label: 'Bollinger Bands Upper' },
  { value: 'boll_lower', label: 'Bollinger Bands Lower' },
  { value: 'atr', label: 'Average True Range' },
  { value: 'obv', label: 'On-Balance Volume' },
  { value: 'stoch_k', label: 'Stochastic %K' },
  { value: 'stoch_d', label: 'Stochastic %D' },
  { value: 'roc', label: 'Rate of Change' },
]

const OPERATORS = [
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: '==', label: '=' },
  { value: '!=', label: '≠' },
]

// TODO: VALIDATE this 
const VALUE_OPTIONS = {
  sector: [
    { value: 'Technology', label: 'Technology' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Financial Services', label: 'Financial Services' },
    { value: 'Consumer Cyclical', label: 'Consumer Cyclical' },
    { value: 'Consumer Defensive', label: 'Consumer Defensive' },
    { value: 'Communication Services', label: 'Communication Services' },
    { value: 'Industrials', label: 'Industrials' },
    { value: 'Energy', label: 'Energy' },
    { value: 'Basic Materials', label: 'Basic Materials' },
    { value: 'Real Estate', label: 'Real Estate' },
    { value: 'Utilities', label: 'Utilities' },
  ],
  industry: [
    { value: 'Software—Infrastructure', label: 'Software—Infrastructure' },
    { value: 'Software—Application', label: 'Software—Application' },
    { value: 'Semiconductors', label: 'Semiconductors' },
    { value: 'Banks—Diversified', label: 'Banks—Diversified' },
    { value: 'Drug Manufacturers—General', label: 'Drug Manufacturers—General' },
    { value: 'Internet Content & Information', label: 'Internet Content & Information' },
    { value: 'Oil & Gas Integrated', label: 'Oil & Gas Integrated' },
    { value: 'Insurance—Diversified', label: 'Insurance—Diversified' },
    { value: 'Beverages—Non-Alcoholic', label: 'Beverages—Non-Alcoholic' },
    { value: 'Discount Stores', label: 'Discount Stores' },
  ],
  country: [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'JP', label: 'Japan' },
    { value: 'CN', label: 'China' },
    { value: 'IN', label: 'India' },
    { value: 'AU', label: 'Australia' },
    { value: 'BR', label: 'Brazil' },
  ],
}

export default function CriteriaBuilder({ type, criteria, setCriteria }) {
  const FIELDS = type === 'fundamental' ? FUNDAMENTAL_FIELDS : TECHNICAL_FIELDS

  const handleChange = (idx, key, value) => {
    const updated = criteria.map((c, i) => {
      if (i === idx) {
        const newCriteria = { ...c, [key]: value };
        if (key === 'field' && VALUE_OPTIONS[value]) {
          newCriteria.operator = '==';
        }
        return newCriteria;
      }
      return c;
    });
    setCriteria(updated);
  }

  const addRow = () => setCriteria([...criteria, { field: '', operator: '', value: '' }])
  const removeRow = idx => setCriteria(criteria.filter((_, i) => i !== idx))

  // TO DO: return error if a line of criteria is not completed (field, op, value all need to be)
  return (
    <div>
      {criteria.map((c, idx) => (
        <div key={idx} className={styles["criteria-row"]}>
    
          <select value={c.field} onChange={e => handleChange(idx, 'field', e.target.value)}>
            <option value="">Field</option>
            {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>

          <select value={c.operator} onChange={e => handleChange(idx, 'operator', e.target.value)} disabled={VALUE_OPTIONS[c.field]}>
            <option value="">Op</option>
            {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {VALUE_OPTIONS[c.field] ? (
            <select
              value={c.value}
              onChange={e => handleChange(idx, 'value', e.target.value)}
            >
              <option value="">Value</option>
              {VALUE_OPTIONS[c.field].map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className={styles["input"]}
              value={c.value}
              onChange={e => handleChange(idx, 'value', e.target.value)}
              placeholder="Value"
            />
          )}
          <button type="button" onClick={() => removeRow(idx)}>✕</button>
        </div>
      ))}
      <button type="button" className={styles["add-criteria-btn"]} onClick={addRow}>
        + Add {type} criteria
      </button>
    </div>
  )
}
