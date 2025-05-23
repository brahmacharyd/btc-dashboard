const WebSocket = require('ws');
const socket = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');

socket.on('message', (data) => {
    const price = JSON.parse(data).p;
    console.log(`BTC Price: ${price}`);
});
