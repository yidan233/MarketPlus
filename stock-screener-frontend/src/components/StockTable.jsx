import { useState } from 'react';
import styles from './StockTable.module.css';

const StockTable = ({ stocks, loading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const stocksPerPage = 20; // Show 20 stocks per page

  const handleViewStock = (symbol) => {
    const currentUrl = window.location.origin;
    const stockUrl = `${currentUrl}/stock/${symbol}`;
    window.open(stockUrl, '_blank');
  };

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

  // Calculate pagination
  const totalPages = Math.ceil(stocks.length / stocksPerPage);
  const startIndex = (currentPage - 1) * stocksPerPage;
  const endIndex = startIndex + stocksPerPage;
  const currentStocks = stocks.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="stock-table">
      <h3 className="stock-table-title">
        Results: {stocks.length} stocks found (Page {currentPage} of {totalPages})
      </h3>
      
      {/* Pagination Controls - At top */}
      {totalPages > 1 && (
        <div className={styles.paginationControls}>
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`${styles.paginationButton} ${
              currentPage === 1 
                ? styles.paginationButtonDisabled 
                : styles.paginationButtonEnabled
            }`}
          >
            ← Previous
          </button>
          
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`${styles.paginationButton} ${
              currentPage === totalPages 
                ? styles.paginationButtonDisabled 
                : styles.paginationButtonEnabled
            }`}
          >
            Next →
          </button>
        </div>
      )}
      
      <div className={`stock-table-scroll ${styles['stock-table-scroll']}`}>
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
            {currentStocks.map((stock) => (
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
                    onClick={() => handleViewStock(stock.symbol)}
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
