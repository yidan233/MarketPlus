import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Screener from './pages/Screener'
import StockDetail from './pages/StockDetail'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Screener />} />
          <Route path="/stock/:symbol" element={<StockDetail />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
