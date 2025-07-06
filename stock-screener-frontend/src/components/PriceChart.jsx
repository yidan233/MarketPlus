import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import styles from './PriceChart.module.css'

const PriceChart = ({ data }) => (
  <div className={styles.chartContainer}>
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <XAxis dataKey="Date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="Close" stroke="#4f8cff" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
)

export default PriceChart
