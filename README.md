# Reya vs Vertex Price Tracker

A simple real-time price comparison tool for BTC on Reya Network and Vertex Protocol.

## Overview

This application provides real-time price data visualization for Bitcoin (BTC) from Reya and Vertex API using web socket.
- backend streams price for each DEX and the server publishes the latest prices for each. 
- frontend displays the prices for each services and show arbitrage opportunities.

### Installation

The process is the same for client and server, in `client` and `server` directories:
- `bun install`
- `bun run dev`
