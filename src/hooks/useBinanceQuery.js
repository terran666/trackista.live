import { useQuery } from '@tanstack/react-query';
import binanceService from '../services/binanceService';
import binanceFuturesService from '../services/binanceFuturesService';

// Детекция среды - если localhost, то пробуем API, иначе сразу мок данные
function isLocalEnvironment() {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

// Простой fetch с fallback на один надежный прокси
async function fetchWithSilentFallback(url, isProduction = false, binanceUrl = '') {
  try {
    const response = await fetch(url);
    if (!response.ok && response.status !== 403) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    if (response.ok) {
      return response;
    }
  } catch (error) {
    // Ничего не делаем, упадет в catch ниже
  }
  
  // Если прямой запрос не работает, пробуем через jsonp или fallback
  if (isProduction && binanceUrl) {
    try {
      // Пробуем через публичный CORS прокси
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(binanceUrl)}`;
      const fallbackResponse = await fetch(proxyUrl);
      if (fallbackResponse.ok) {
        return fallbackResponse;
      }
    } catch (e) {
      // Если и прокси не работает, упадет в основной catch
    }
  }
  
  throw new Error('API unavailable');
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
export function useBinanceKlines(symbol, interval = '1m', spot = true, limit = 1000) {
  return useQuery({
    queryKey: ['binance-klines', symbol, interval, spot, limit],
    queryFn: async () => {
      if (!symbol) return [];
      
      try {
        // Везде используем одинаковую логику - прямое API
        const binanceUrl = spot 
          ? `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
          : `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        
        // Сначала пробуем прямой запрос (работает везде одинаково)
        const url = binanceUrl;
        
        // Используем обёртку fetch с fallback 
        const response = await fetchWithSilentFallback(url, true, binanceUrl);
        
        let rawData;
        const responseData = await response.json();
        
        // Везде одинаковая обработка - может быть прямой формат или через allorigins
        if (responseData.contents) {
          // allorigins формат
          rawData = JSON.parse(responseData.contents);
        } else if (Array.isArray(responseData)) {
          // Прямой формат от Binance
          rawData = responseData;
        } else {
          throw new Error('Unexpected response format');
        }
        
        // Проверяем что данные корректные (массив массивов)
        if (!Array.isArray(rawData) || rawData.length === 0 || !Array.isArray(rawData[0])) {
          throw new Error('Invalid data format');
        }
        
        // Преобразуем данные в формат KLineCharts
        const formattedData = rawData.map((item) => ({
          timestamp: item[0],
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5])
        }));
        
        console.log('✅ Загружены реальные данные Binance API');
        return formattedData;
      } catch (error) {
        // Fallback на тестовые данные
        console.log('⚠️ Используются тестовые данные (API недоступен)');
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
  const baseTime = Date.now() - 17 * 60 * 60 * 1000; // 17 часов назад для 1000 минутных свечей
  let price = 43250; // Реалистичная цена BTC
  
  for (let i = 0; i < 1000; i++) { // 1000 свечей для полной истории
    const timestamp = baseTime + i * 60 * 1000; // Интервал 1 минута
    
    // Полностью случайные изменения без паттернов
    const volatility = 0.004; // 0.4% волатильность 
    const randomChange = (Math.random() - 0.5) * volatility;
    
    // Иногда делаем большие скачки (как в реальности)
    const bigMove = Math.random() < 0.05 ? (Math.random() - 0.5) * 0.01 : 0;
    
    const change = randomChange + bigMove;
    
    const open = price;
    const close = price * (1 + change);
    
    // Случайные high/low без привязки к тренду
    const highOffset = Math.random() * price * 0.003;
    const lowOffset = Math.random() * price * 0.003;
    
    const high = Math.max(open, close) + highOffset;
    const low = Math.min(open, close) - lowOffset;
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