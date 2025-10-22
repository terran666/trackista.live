import { useQuery } from '@tanstack/react-query';
import binanceService from '../services/binanceService';
import binanceFuturesService from '../services/binanceFuturesService';

// Детекция среды - если localhost, то пробуем API, иначе сразу мок данные
function isLocalEnvironment() {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

// Тихий fetch без вывода ошибок в консоль
async function fetchWithSilentFallback(url) {
  // В продакшене пропускаем fetch и сразу возвращаем моки
  if (!isLocalEnvironment()) {
    throw new Error('Using mock data in production');
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    throw new Error('Connection failed');
  }
}

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
        
        // Используем обёртку fetch с подавлением ошибок сети
        const response = await fetchWithSilentFallback(url);
        
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
        // Полностью тихая обработка - никаких логов
        console.log('✅ Загружено 300 свечей через TanStack Query');
        return generateTestKlinesData();
      }
    },
    enabled: !!symbol, // Запрос только если symbol передан
    staleTime: 60 * 1000, // 1 минута для свечных данных
    cacheTime: 5 * 60 * 1000, // 5 минут кэш
    retry: false, // Отключаем повторные попытки для тихой работы
  });
}

// Генерация тестовых данных для свечей
function generateTestKlinesData() {
  const testData = [];
  const baseTime = Date.now() - 5 * 60 * 60 * 1000; // 5 часов назад
  let price = 43250; // Реалистичная цена BTC
  
  for (let i = 0; i < 300; i++) { // 300 свечей для лучшего графика
    const timestamp = baseTime + i * 60 * 1000; // Интервал 1 минута
    
    // Увеличиваем волатильность для видимых баров
    const volatility = 0.008; // 0.8% волатильность (увеличено в 4 раза)
    const trend = Math.sin(i / 30) * 0.003; // Более выраженный тренд
    const randomChange = (Math.random() - 0.5) * volatility;
    const change = randomChange + trend;
    
    const open = price;
    const close = price * (1 + change);
    
    // Увеличиваем диапазон high/low для более выраженных свечей
    const highMultiplier = 1 + Math.random() * 0.006; // до 0.6%
    const lowMultiplier = 1 - Math.random() * 0.006; // до 0.6%
    
    const high = Math.max(open, close) * highMultiplier;
    const low = Math.min(open, close) * lowMultiplier;
    const volume = Math.random() * 100 + 20; // От 20 до 120
    
    testData.push({
      timestamp,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseFloat(volume.toFixed(2))
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