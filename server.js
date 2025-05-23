const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let btcPrice = null;

const binanceSocket = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');

binanceSocket.on('message', (data) => {
  const trade = JSON.parse(data);
  btcPrice = parseFloat(trade.p);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ price: btcPrice }));
    }
  });
});

app.get('/oi', async (req, res) => {
  // Placeholder for Open Interest API logic
  res.json({ oi: Math.random() * 100000 }); // Replace with real OI fetch
});

server.listen(3000, () => console.log('Server running on port 3000'));
