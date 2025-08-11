import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import styles from './PriceChart.module.css'

const MovingAverageChart = ({ data }) => {
  // Calculate moving averages
  const calculateMA = (data, period) => {
    const maData = []
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        maData.push({ Date: data[i].Date, MA: null })
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, item) => acc + (item.Close || 0), 0)
        maData.push({ Date: data[i].Date, MA: sum / period })
      }
    }
    return maData
  }

  // Format data for moving average chart
  const maData = data?.map((item, index) => {
    const ma20 = calculateMA(data, 20)[index]?.MA
    const ma50 = calculateMA(data, 50)[index]?.MA
    
    return {
      Date: new Date(item.Date).toLocaleDateString(),
      Close: item.Close || 0,
      MA20: ma20,
      MA50: ma50
    }
  }) || []

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={maData}>
          <XAxis dataKey="Date" />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [
              typeof value === 'number' ? `$${value.toFixed(2)}` : value, 
              name
            ]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="Close" 
            stroke="#4f8cff" 
            dot={false} 
            name="Price"
          />
          <Line 
            type="monotone" 
            dataKey="MA20" 
            stroke="#f59e0b" 
            dot={false} 
            name="MA(20)"
            strokeDasharray="5 5"
          />
          <Line 
            type="monotone" 
            dataKey="MA50" 
            stroke="#ef4444" 
            dot={false} 
            name="MA(50)"
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default MovingAverageChart 