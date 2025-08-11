import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import styles from './PriceChart.module.css'

const PriceChart = ({ data }) => {
  // Ensure data is in the right format
  const chartData = data?.map(item => ({
    Date: item.Date || item.date || item.index,
    Close: parseFloat(item.Close) || 0
  })).filter(item => item.Close > 0) || []
  
  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <XAxis dataKey="Date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="Close" stroke="#4f8cff" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PriceChart
