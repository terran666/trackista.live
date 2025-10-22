const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Включаем CORS для всех запросов
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Прокси для Binance Spot API
app.use('/api/spot', createProxyMiddleware({
  target: 'https://api.binance.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/spot': '/api/v3',
  },
  onError: (err, req, res) => {
    console.error('Spot API error:', err.message);
    res.status(500).json({ error: 'Spot API недоступен' });
  }
}));

// Прокси для Binance Futures API
app.use('/api/futures', createProxyMiddleware({
  target: 'https://fapi.binance.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/futures': '/fapi/v1',
  },
  onError: (err, req, res) => {
    console.error('Futures API error:', err.message);
    res.status(500).json({ error: 'Futures API недоступен' });
  }
}));

app.listen(PORT, () => {
  console.log(`🚀 Binance CORS Proxy запущен на http://localhost:${PORT}`);
  console.log(`📊 Spot API: http://localhost:${PORT}/api/spot/*`);
  console.log(`📈 Futures API: http://localhost:${PORT}/api/futures/*`);
  console.log('');
  console.log('Пример использования:');
  console.log(`curl "http://localhost:${PORT}/api/spot/klines?symbol=BTCUSDT&interval=1m&limit=10"`);
});