import React, { useState } from 'react'
import { stockApi } from '../services/api'
import styles from './WatchlistForm.module.css'

const WatchlistForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    index: 'sp500',
    fundamental_criteria: [{ field: '', operator: '', value: '' }],
    technical_criteria: [{ field: '', operator: '', value: '' }],
    emailAlerts: false, // ← CHANGED: Default to false
    alertFrequency: 'daily' // 'immediate', 'daily', 'weekly'
  })
  
  const [availableFields, setAvailableFields] = useState({
    fundamental: [],
    technical: []
  })

  // Load available fields on component mount
  React.useEffect(() => {
    loadAvailableFields()
  }, [])

  const loadAvailableFields = async () => {
    try {
      const response = await stockApi.getIndicators()
      setAvailableFields({
        fundamental: response.fundamental_fields || [],
        technical: response.technical_indicators || []
      })
    } catch (error) {
      console.error('Failed to load indicators:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Please enter a watch name')
      return
    }

    const hasCriteria = formData.fundamental_criteria.some(c => c.field && c.operator && c.value) ||
                       formData.technical_criteria.some(c => c.field && c.operator && c.value)

    if (!hasCriteria) {
      alert('Please add at least one criterion')
      return
    }

    // Create the proper data structure
    const watchData = {
      name: formData.name,
      index: formData.index,
      criteria: {  // ← Make sure this structure is correct
        fundamental_criteria: formData.fundamental_criteria.filter(c => c.field && c.operator && c.value),
        technical_criteria: formData.technical_criteria.filter(c => c.field && c.operator && c.value)
      },
      emailAlerts: formData.emailAlerts,
      alertFrequency: formData.alertFrequency
    }

    await onSubmit(watchData)
  }

  const addCriterion = (type) => {
    setFormData(prev => ({
      ...prev,
      [`${type}_criteria`]: [...prev[`${type}_criteria`], { field: '', operator: '', value: '' }]
    }))
  }

  const removeCriterion = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [`${type}_criteria`]: prev[`${type}_criteria`].filter((_, i) => i !== index)
    }))
  }

  const updateCriterion = (type, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [`${type}_criteria`]: prev[`${type}_criteria`].map((criterion, i) => 
        i === index ? { ...criterion, [field]: value } : criterion
      )
    }))
  }

  const operators = ['>', '<', '>=', '<=', '==', '!=']

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Basic Info */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Watch Details</h3>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Watch Name</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Tech Growth Stocks"
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="index">Index</label>
            <select
              id="index"
              value={formData.index}
              onChange={(e) => setFormData(prev => ({ ...prev, index: e.target.value }))}
              className={styles.select}
            >
              <option value="sp500">S&P 500</option>
              <option value="nasdaq100">NASDAQ 100</option>
              <option value="dow30">Dow 30</option>
            </select>
          </div>
        </div>

        {/* Fundamental Criteria */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Fundamental Criteria</h3>
          {formData.fundamental_criteria.map((criterion, index) => (
            <div key={index} className={styles.criterionRow}>
              <select
                value={criterion.field}
                onChange={(e) => updateCriterion('fundamental', index, 'field', e.target.value)}
                className={styles.fieldSelect}
              >
                <option value="">Select field</option>
                {availableFields.fundamental.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
              
              <select
                value={criterion.operator}
                onChange={(e) => updateCriterion('fundamental', index, 'operator', e.target.value)}
                className={styles.operatorSelect}
              >
                <option value="">Operator</option>
                {operators.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
              
              <input
                type="text"
                value={criterion.value}
                onChange={(e) => updateCriterion('fundamental', index, 'value', e.target.value)}
                placeholder="Value"
                className={styles.valueInput}
              />
              
              <button
                type="button"
                onClick={() => removeCriterion('fundamental', index)}
                className={styles.removeButton}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addCriterion('fundamental')}
            className={styles.addButton}
          >
            + Add Fundamental Criterion
          </button>
        </div>

        {/* Technical Criteria */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Technical Criteria</h3>
          {formData.technical_criteria.map((criterion, index) => (
            <div key={index} className={styles.criterionRow}>
              <select
                value={criterion.field}
                onChange={(e) => updateCriterion('technical', index, 'field', e.target.value)}
                className={styles.fieldSelect}
              >
                <option value="">Select field</option>
                {availableFields.technical.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
              
              <select
                value={criterion.operator}
                onChange={(e) => updateCriterion('technical', index, 'operator', e.target.value)}
                className={styles.operatorSelect}
              >
                <option value="">Operator</option>
                {operators.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
              
              <input
                type="text"
                value={criterion.value}
                onChange={(e) => updateCriterion('technical', index, 'value', e.target.value)}
                placeholder="Value"
                className={styles.valueInput}
              />
              
              <button
                type="button"
                onClick={() => removeCriterion('technical', index)}
                className={styles.removeButton}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addCriterion('technical')}
            className={styles.addButton}
          >
            + Add Technical Criterion
          </button>
        </div>

        {/* Email Alerts */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Email Alerts</h3>
          <div className={styles.alertSettings}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.emailAlerts}
                onChange={(e) => setFormData(prev => ({ ...prev, emailAlerts: e.target.checked }))}
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>
                Send email alerts when stocks match criteria
              </span>
            </label>
            
            {formData.emailAlerts && (
              <>
                <div className={styles.alertInfo}>
                  <p className={styles.alertDescription}>
                    📧 You'll receive email notifications when stocks match your criteria.
                  </p>
                </div>
                
                <div className={styles.inputGroup}>
                  <label htmlFor="frequency">Alert Frequency</label>
                  <select
                    id="frequency"
                    value={formData.alertFrequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, alertFrequency: e.target.value }))}
                    className={styles.select}
                  >
                    <option value="immediate">Immediate - Get notified as soon as stocks match</option>
                    <option value="daily">Daily Summary - Get one email per day with all matches</option>
                    <option value="weekly">Weekly Summary - Get one email per week with all matches</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className={styles.submitSection}>
          <button 
            type="submit" 
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Creating Watch...' : 'Create Watch'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default WatchlistForm 