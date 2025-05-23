let prices = [];
let volumes = [];

function processPrice(price, volume, oi) {
  price = parseFloat(price);
  volume = parseFloat(volume);
  oi = parseFloat(oi);

  prices.push(price);
  volumes.push(volume);

  if (prices.length > 20) prices.shift();
  if (volumes.length > 20) volumes.shift();

  const trend = prices[prices.length - 1] - prices[0]; // price momentum
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

  let signal = 'HOLD';
  let target = null;

  if (trend > 100 && volume > avgVolume && oi > 20000) {
    signal = 'BUY';
    target = price + 150;
  } else if (trend < -100 && volume > avgVolume && oi < 15000) {
    signal = 'SELL';
    target = price - 150;
  }

  return { signal, target };
}

module.exports = { processPrice };
