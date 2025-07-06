import { useNavigate } from 'react-router-dom';

// display the result in a table 
const StockTable = ({ stocks, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="stock-table">
        <div className="loading">
          <p>Loading results...</p>
        </div>
      </div>
    )
  }

  if (!stocks || stocks.length === 0) {
    return (
      <div className="stock-table">
        <div className="no-results">
          <p>No stocks found matching your criteria...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="stock-table">
      <h3 className="stock-table-title">Results: ({stocks.length} stocks found)</h3>
      
      <div className="stock-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Price</th>
              <th>Market Cap</th>
              <th>P/E Ratio</th>
              <th>Sector</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr key={stock.symbol}>
                <td className="symbol">{stock.symbol}</td>
                <td className="price">${stock.price?.toFixed(2) || 'N/A'}</td>
                <td className="market-cap">
                  {stock.market_cap 
                    ? `$${(stock.market_cap / 1e9).toFixed(2)}B` 
                    : 'N/A'
                  }
                </td>
                <td className="pe-ratio">
                  {stock.pe_ratio?.toFixed(2) || 'N/A'}
                </td>
                <td className="sector">{stock.sector || 'N/A'}</td>
                <td className="actions">
                  <button
                    className="view-btn"
                    onClick={() => navigate(`/stock/${stock.symbol}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StockTable
