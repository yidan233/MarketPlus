import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import styles from './PriceChart.module.css'

const VolumeChart = ({ data }) => {
  // Format data for volume chart
  const volumeData = data?.map(item => ({
    Date: new Date(item.Date).toLocaleDateString(),
    Volume: item.Volume || 0
  })) || []

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={volumeData}>
          <XAxis dataKey="Date" />
          <YAxis />
          <Tooltip 
            formatter={(value) => [value.toLocaleString(), 'Volume']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Bar dataKey="Volume" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default VolumeChart 