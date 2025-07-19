import { useState } from 'react'
import styles from './CriteriaBuilder.module.css'
const FUNDAMENTAL_FIELDS = [
  { value: 'market_cap', label: 'Market Cap' },
  { value: 'pe_ratio', label: 'P/E Ratio' },
  { value: 'sector', label: 'Sector' },
  // TODO, finish the dropdown for the fundamental fields
]

const TECHNICAL_FIELDS = [
  { value: 'rsi', label: 'RSI' },
  { value: 'ma', label: 'Moving Average' },
  // TODO, finish the dropdown for the technical fields
]

const OPERATORS = [
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: '==', label: '=' },
  { value: '!=', label: '≠' },
]

const VALUE_OPTIONS = {
  sector: [
    { value: 'Technology', label: 'Technology' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Financial', label: 'Financial' },
    // Todo: finish the exact match criteria 
  ],
}

export default function CriteriaBuilder({ type, criteria, setCriteria }) {
  const FIELDS = type === 'fundamental' ? FUNDAMENTAL_FIELDS : TECHNICAL_FIELDS

  const handleChange = (idx, key, value) => {
    const updated = criteria.map((c, i) =>
      i === idx ? { ...c, [key]: value } : c
    )
    setCriteria(updated)
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

          <select value={c.operator} onChange={e => handleChange(idx, 'operator', e.target.value)}>
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
