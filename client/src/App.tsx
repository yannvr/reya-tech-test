import { useState, useEffect, useRef } from 'react'

// Define types for price data
interface PriceData {
  reya: number;
  vertex: number;
}

interface PriceUpdate {
  asset: string;
  reya: number;
  vertex: number;
}

function App() {
  // State for price data
  const [prices, setPrices] = useState<Record<string, PriceData>>({
    BTC: { reya: 0, vertex: 0, }
  });

  // State for price history (for charts)
  const [priceHistory, setPriceHistory] = useState<Record<string, PriceData[]>>({
    BTC: []
  });

  // State for connection status
  const [connected, setConnected] = useState(false);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to WebSocket server
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:3001');

      ws.onopen = () => {
        console.log('Connected to server');
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data: PriceUpdate = JSON.parse(event.data);

          // Only handle BTC data
          if (data.asset !== 'BTC') return;

          // Update prices
          setPrices(prev => ({
            ...prev,
            [data.asset]: {
              reya: data.reya,
              vertex: data.vertex,
            }
          }));

          // Update price history
          setPriceHistory(prev => {
            const newHistory = { ...prev };

            // Add new data point
            newHistory[data.asset] = [
              ...newHistory[data.asset] || [],
              {
                reya: data.reya,
                vertex: data.vertex,
                timestamp: data.timestamp
              }
            ];

            // Limit history to 100 points
            if (newHistory[data.asset].length > 100) {
              newHistory[data.asset] = newHistory[data.asset].slice(-100);
            }

            return newHistory;
          });
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from server');
        setConnected(false);

        // Attempt to reconnect after a delay
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="app-container">
      <header>
        <h1>BTC Price Tracker</h1>
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

    </div>
  )
}

export default App
