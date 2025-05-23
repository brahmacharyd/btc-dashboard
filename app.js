const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*' }, // Update for production
});

let currentOI = 50000;
let currentVolume = 0;

// Simulate OI changes
setInterval(() => {
  const change = (Math.random() - 0.5) * 2000;
  currentOI = Math.max(0, currentOI + change);
}, 2000);

// Simulate dummy volume changes
setInterval(() => {
  const change = Math.random() * 5; // random volume increment
  currentVolume = Math.max(0, currentVolume + change);
}, 1000);

app.get('/', (req, res) => {
  res.send('BTC Dashboard Server running. Use /oi and /volume endpoints.');
});

app.get('/oi', (req, res) => {
  res.json({ oi: currentOI.toFixed(2) });
});

app.get('/volume', (req, res) => {
  res.json({ volume: currentVolume.toFixed(2) });
});

// Signal logic
function processSignal(price, oi, topBidQty, topAskQty) {
  if (price > 110000 && oi > 20000 && topBidQty > topAskQty * 1.5) return 'BUY';
  if (price < 108000 && oi < 15000 && topAskQty > topBidQty * 1.5) return 'SELL';
  return 'NEUTRAL';
}

const binanceSocket = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
let latestPrice = 0;

binanceSocket.on('message', (data) => {
  const trade = JSON.parse(data);
  latestPrice = parseFloat(trade.p);
});

binanceSocket.on('error', (err) => {
  console.error('Binance trade socket error:', err);
});
binanceSocket.on('close', () => {
  console.warn('Binance trade socket closed.');
});

const orderBookSocket = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@depth5@100ms');
let topBids = [];
let topAsks = [];

orderBookSocket.on('message', (data) => {
  const orderBook = JSON.parse(data);

  topBids = orderBook.bids
    .filter(bid => parseFloat(bid[1]) > 0)
    .slice(0, 3)
    .map(bid => ({ price: parseFloat(bid[0]), qty: parseFloat(bid[1]) }));

  topAsks = orderBook.asks
    .filter(ask => parseFloat(ask[1]) > 0)
    .slice(0, 3)
    .map(ask => ({ price: parseFloat(ask[0]), qty: parseFloat(ask[1]) }));
});

orderBookSocket.on('error', (err) => {
  console.error('Binance order book socket error:', err);
});
orderBookSocket.on('close', () => {
  console.warn('Binance order book socket closed.');
});

// Emit data every 200ms
setInterval(() => {
  const topBidQty = topBids[0]?.qty || 0;
  const topAskQty = topAsks[0]?.qty || 0;
  const signal = processSignal(latestPrice, currentOI, topBidQty, topAskQty);

  io.emit('btcData', {
    price: latestPrice,
    oi: currentOI,
    volume: currentVolume,
    signal,
    topBids,
    topAsks
  });
}, 200);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
