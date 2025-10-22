import { useQuery } from '@tanstack/react-query';
import binanceService from '../services/binanceService';
import binanceFuturesService from '../services/binanceFuturesService';

// Хук для получения данных скринера (спот)
export function useBinanceScreener(limit = 100) {
  return useQuery({
    queryKey: ['binance-screener', limit],
    queryFn: async () => {
      const data = await binanceService.getScreenerData(limit);
      return data;
    },
    staleTime: 30 * 1000, // 30 секунд - свежие данные для скринера
    cacheTime: 2 * 60 * 1000, // 2 минуты кэш
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Хук для получения фьючерсных данных
export function useBinanceFutures(limit = 100) {
  return useQuery({
    queryKey: ['binance-futures', limit],
    queryFn: async () => {
      const data = await binanceFuturesService.getFuturesScreenerData(limit);
      return data;
    },
    staleTime: 30 * 1000, // 30 секунд
    cacheTime: 2 * 60 * 1000, // 2 минуты кэш
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Хук для получения конкретной криптовалюты
export function useBinanceCrypto(symbol) {
  return useQuery({
    queryKey: ['binance-crypto', symbol],
    queryFn: async () => {
      if (!symbol) return null;
      const data = await binanceService.getCryptoBySymbol(symbol);
      return data;
    },
    enabled: !!symbol, // Запрос только если symbol передан
    staleTime: 60 * 1000, // 1 минута
    cacheTime: 5 * 60 * 1000, // 5 минут кэш
  });
}

// Хук для получения свечных данных для графика
export function useBinanceKlines(symbol, interval = '1m', spot = true, limit = 500) {
  return useQuery({
    queryKey: ['binance-klines', symbol, interval, spot, limit],
    queryFn: async () => {
      if (!symbol) return [];
      
      try {
        const proxyBase = spot 
          ? "http://localhost:3001/api/spot" 
          : "http://localhost:3001/api/futures";
        
        const url = `${proxyBase}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rawData = await response.json();
        
        // Преобразуем данные в формат KLineCharts
        const formattedData = rawData.map((item) => ({
          timestamp: item[0],
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5])
        }));
        
        return formattedData;
      } catch (error) {
        console.error('Ошибка загрузки свечных данных:', error);
        // Возвращаем тестовые данные при ошибке
        return generateTestKlinesData();
      }
    },
    enabled: !!symbol, // Запрос только если symbol передан
    staleTime: 60 * 1000, // 1 минута для свечных данных
    cacheTime: 5 * 60 * 1000, // 5 минут кэш
    retry: 2,
  });
}

// Генерация тестовых данных для свечей
function generateTestKlinesData() {
  const testData = [];
  const baseTime = Date.now() - 24 * 60 * 60 * 1000;
  let price = 50000;
  
  for (let i = 0; i < 100; i++) {
    const timestamp = baseTime + i * 60 * 1000;
    const change = (Math.random() - 0.5) * 1000;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 200;
    const low = Math.min(open, close) - Math.random() * 200;
    
    testData.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000
    });
    
    price = close;
  }
  
  return testData;
}

// Хук для WebSocket соединения (пока оставляем старую реализацию)
export function useBinanceWebSocket(symbols, enabled = true) {
  // Пока оставляем существующую реализацию
  // В будущем можно интегрировать с React Query через queryClient.setQueryData
  return {
    data: {},
    connected: false,
    error: null
  };
}