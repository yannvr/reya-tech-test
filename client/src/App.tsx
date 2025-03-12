import { useState, useEffect, useRef } from 'react'
import PriceTable from './components/PriceTable';


interface PriceData {
  reya: number;
  vertex: number;
  timestamp: number;
}

interface PriceUpdate {
  asset: 'BTC'; // We will only accept BTC for the assignment
  reya: number;
  vertex: number;
}

function App() {
  // State for price data
  const [prices, setPrices] = useState<Record<string, PriceData>>({
    BTC: { reya: 0, vertex: 0, timestamp: Date.now() }
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
              timestamp: Date.now()
            }
          }));
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
      <main>
        <div className="price-tables">
          <PriceTable prices={prices} />
        </div>
      </main>
    </div>
  )
}

export default App
