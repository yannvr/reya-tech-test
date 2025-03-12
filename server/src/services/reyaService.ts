import { SocketClient, CandlesResolution } from '@reyaxyz/api-sdk';
import type { SocketMessage } from '@reyaxyz/api-sdk';

interface ReyaCandleData {
  startedAt: string;
  market_id: string;
  resolution: string;
  low: string;
  high: string;
  open: string;
  close: string;
  baseTokenVolume: string;
  usdVolume: string;
  trades: number;
  startingOpenInterest: string;
  ticker: string;
}

interface ReyaCandleMessage extends SocketMessage {
  contents: ReyaCandleData[];
}

let priceCallbacks: ((asset: string, price: number) => void)[] = [];

// Store latest price as a single value
let latestPrice = 0;

export function initReyaWebSocket() {

  try {
    // Create socket client using the official SDK
    const socketClient = new SocketClient({
      environment: 'production',  // production/test/local
      onOpen: () => {
        console.log('Reya WebSocket connected');

        // Subscribe to candle data for BTC only
        socketClient?.subscribeToCandles('BTC-rUSD', CandlesResolution.ONE_MINUTE as CandlesResolution);
        console.log('Subscribed to Reya BTC candles');
      },
      onClose: () => {
        // We could have retrying logic here but we'll keep it simple
        console.log('Reya WebSocket disconnected');
      },
      onMessage: (parsedMessage: SocketMessage) => {
        try {
          const isCandleMessage = parsedMessage.channel === 'candles' && parsedMessage.type === 'channel_batch_data' && parsedMessage.id?.includes('BTC-rUSD');
          if (isCandleMessage) {
            const candleMessage = parsedMessage as ReyaCandleMessage;
            const contents = candleMessage.contents;

            if (contents?.length > 0) {
              const candleData = contents[0];
              const ticker = candleData.ticker; // e.g., "BTC-rUSD"
              const closePrice = parseFloat(candleData.close);

              if (ticker && closePrice && ticker === 'BTC-rUSD') {
                const asset = 'BTC';
                latestPrice = closePrice;
                console.log(`Reya price update for ${asset}: ${closePrice}`);
                // Notify all callbacks
                priceCallbacks.forEach(callback => callback(asset, closePrice));
              }
            }
          }
        } catch (error) {
          console.error('Error handling Reya WebSocket message:', error);
        }
      },
    });

    socketClient.connect();
  } catch (error) {
    console.error('Error initializing Reya WebSocket:', error);
  }
}
