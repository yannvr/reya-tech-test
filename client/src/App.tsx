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
  const [prices, setPrices] = useState<Record<string, PriceData>>({
    BTC: { reya: 0, vertex: 0, timestamp: Date.now() }
  });

  const [connected, setConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

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

          // We're only interested in BTC data
          if (data.asset !== 'BTC') return;

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

        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3 * 1000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };

      wsRef.current = ws;
    };

    connectWebSocket();

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
