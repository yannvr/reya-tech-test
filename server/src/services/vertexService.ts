import axios from 'axios';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const VERTEX_WS_URL = 'wss://gateway.prod.vertexprotocol.com/v1/ws';

const PRODUCT_ID = 'BTC';

let isConnected = false;
let priceCallbacks: ((asset: string, price: number) => void)[] = [];

// Store latest price as a single value
let latestPrice = 0;

export function initVertexWebSocket() {
  const websocket = new WebSocket(VERTEX_WS_URL);

  websocket.on('open', () => {
    console.log('Vertex WebSocket connected');
    isConnected = true;

    // Subscribe to market prices for BTC only
    const message = JSON.stringify({
      type: "market_price",
      product_id: newFunction(),
    });
    websocket?.send(message);
  });

  websocket.on('message', (data: WebSocket.Data) => {
    try {
      const message = JSON.parse(data.toString());

      const isQueryMarketPriceMessage = message.status === 'success' && message.request_type === 'query_market_price';
      if (isQueryMarketPriceMessage) {
        const productId = message.data.product_id;

        // Only process BTC price updates
        if (productId === PRODUCT_ID) {
          // Calculate mid price from bid and ask
          const bidPrice = parseFloat(message.data.bid_x18) / 1e18;
          const askPrice = parseFloat(message.data.ask_x18) / 1e18;
          const midPrice = (bidPrice + askPrice) / 2;

          // Update latest price
          latestPrice = midPrice;

          // Notify all callbacks
          priceCallbacks.forEach(callback => callback(PRODUCT_ID, midPrice));
        }
      }
    } catch (error) {
      console.error('Error parsing Vertex WebSocket message:', error);
    }
  });

  websocket.on('close', () => {
    console.log('Vertex WebSocket disconnected');
    isConnected = false;

    // Attempt to reconnect after a delay
    setTimeout(() => {
      initVertexWebSocket();
    }, 5000);
  });

  websocket.on('error', (error) => {
    console.error('Vertex WebSocket error:', error);
    websocket?.close();
  });
}

/**
 * Register a callback to receive price updates
 * @param callback Function to call when price updates are received
 */
export function onVertexPriceUpdate(callback: (asset: string, price: number) => void) {
  priceCallbacks.push(callback);
}

/**
 * Fetch price data from Vertex DEX
 * @param asset Asset symbol (e.g., 'BTC')
 * @returns Price data object
 */
export async function fetchVertexPrice(asset: string): Promise<number> {
  try {
    // If WebSocket is connected and we have a price, return it
    if (isConnected && latestPrice > 0) {
      return latestPrice;
    }

    // Otherwise, use mock data
    const mockPrice = 64800 + (Math.random() * 1000 - 500); // Random fluctuation around $64800

    return mockPrice;
  } catch (error) {
    console.error(`Error fetching Vertex price for ${asset}:`, error);
    return 0;
  }
}
