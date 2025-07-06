import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { stockApi } from '../services/api'
import PriceChart from '../components/PriceChart'
import styles from './StockDetail.module.css'

const StockInfo = () => {
  const { symbol } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    stockApi.getStockDetail(symbol)
      .then(setData)
      .catch((err) => setError(err.message || 'Error loading stock'))
      .finally(() => setLoading(false))
  }, [symbol])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return <div>No data found.</div>

  const { info, historical } = data

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {info.shortName} <span style={{ color: '#7fa7ff' }}>({info.symbol})</span>
        </h1>
        <div className={styles.subtitle}>
          {info.sector} | {info.industry}
        </div>
        <div>
          <a href={info.website} target="_blank" rel="noopener noreferrer" className={styles.link}>
            {info.website}
          </a>
        </div>
      </div>
      <div className={styles.main}>
        <div className={styles.left}>
          <section className={styles.section}>
            <h2>Company Description</h2>
            <p className={styles.description}>
              {info.longBusinessSummary || "No description available."}
            </p>
          </section>
          {/* You can add more company info here if needed */}
        </div>
        <div className={styles.right}>
          <section>
            <h2>Price History</h2>
            <PriceChart data={historical} />
          </section>
        </div>
      </div>
    </div>
  )
}

export default StockInfo