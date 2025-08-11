const axios = require('axios');

const currencySources = [
    { symbol: 'BTC', url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT' },
    { symbol: 'TON', url: 'https://api.binance.com/api/v3/ticker/price?symbol=TONUSDT' }
];

async function getPrices() {
    const prices = {};
    for (const { symbol, url } of currencySources) {
        const res = await axios.get(url);
        prices[symbol] = parseFloat(res.data.price);
    }
    return prices; // { BTC: 12345.67, TON: 2.34 }
}

module.exports = { getPrices, currencySources };