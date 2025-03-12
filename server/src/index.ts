import cors from 'cors';
import express from 'express';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { initReyaWebSocket, onReyaPriceUpdate } from './services/reyaService';
import { initVertexWebSocket, onVertexPriceUpdate } from './services/vertexService';

const app = express();
const port = 3001;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const clients = new Set<WebSocket>();
const latestPrices: Record<string, { reya: number, vertex: number, timestamp: number }> = {
  'BTC': { reya: 0, vertex: 0, timestamp: Date.now() }
};

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  clients.add(ws);

  // Send the latest prices to the newly connected client
  Object.entries(latestPrices).forEach(([asset, data]) => {
    const message = JSON.stringify({
      asset,
      timestamp: data.timestamp,
      reya: data.reya,
      vertex: data.vertex
    });
    ws.send(message);
  });

  ws.on('message', (message) => {
    console.log('Received message:', message.toString());
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});


initReyaWebSocket();
initVertexWebSocket();

// Handle price updates from Reya
onReyaPriceUpdate((asset: string, price: number) => {
  console.log(`Reya price update for ${asset}: ${price}`);

  if (latestPrices[asset]) {
    latestPrices[asset].reya = price;
    latestPrices[asset].timestamp = Date.now();
  } else {
    latestPrices[asset] = {
      reya: price,
      vertex: 0,
      timestamp: Date.now()
    };
  }

  const message = JSON.stringify({
    asset,
    timestamp: latestPrices[asset].timestamp,
    reya: latestPrices[asset].reya,
    vertex: latestPrices[asset].vertex
  });

  clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

onVertexPriceUpdate((asset: string, price: number) => {
  console.log(`Vertex price update for ${asset}: ${price}`);

  if (latestPrices[asset]) {
    latestPrices[asset].vertex = price;
    latestPrices[asset].timestamp = Date.now();
  } else {
    latestPrices[asset] = {
      reya: 0,
      vertex: price,
      timestamp: Date.now()
    };
  }

  const message = JSON.stringify({
    asset,
    timestamp: latestPrices[asset].timestamp,
    reya: latestPrices[asset].reya,
    vertex: latestPrices[asset].vertex
  });

  clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default server;
