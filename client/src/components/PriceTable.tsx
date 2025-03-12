interface PriceData {
  reya: number;
  vertex: number;
  timestamp: number;
}

interface PriceTableProps {
  prices: Record<string, PriceData>;
}

const PriceTable = ({ prices }: PriceTableProps) => {
  return (
    <div className="price-table-container">
      <h2>Current Prices</h2>
      <table className="price-table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Reya Price</th>
            <th>Vertex Price</th>
            <th>Difference</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(prices).map(([asset, data]) => {
            const priceDiff = Math.abs(data.reya - data.vertex).toFixed(2);
            const diffPercent = data.reya > 0
              ? ((Math.abs(data.reya - data.vertex) / data.reya) * 100).toFixed(2)
              : '0.00';

            // Determine if there's an arbitrage opportunity (difference > 0.5%)
            const hasArbitrageOpportunity = parseFloat(diffPercent) > 0.5;

            return (
              <tr key={asset} className={hasArbitrageOpportunity ? 'arbitrage-opportunity' : ''}>
                <td>{asset}</td>
                <td>${data.reya.toFixed(2)}</td>
                <td>${data.vertex.toFixed(2)}</td>
                <td className="price-diff">
                  ${priceDiff} ({diffPercent}%)
                  {hasArbitrageOpportunity && (
                    <span className="arbitrage-badge">Arbitrage</span>
                  )}
                </td>
                <td>{new Date(data.timestamp).toLocaleTimeString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PriceTable;
