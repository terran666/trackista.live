import { useState, useEffect, useRef } from 'react';
import binanceService from '../services/binanceService';

// Утилиты для обработки данных
const toNum = (s) => Number.parseFloat(s);
const fmt = (n, d = 2) => (n === null || n === undefined || Number.isNaN(n) ? "—" : Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: d }));

function median(values) {
  if (!values.length) return 0;
  const arr = [...values].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

// Хук для получения данных orderbook через WebSocket
export function useBinanceOrderbook(symbol) {
  const [depth, setDepth] = useState({ bids: [], asks: [], lastUpdateId: 0 });
  const [walls, setWalls] = useState({ bidWalls: [], askWalls: [] });
  const [stats, setStats] = useState({ bidCount: 0, askCount: 0, maxWall: 0, medianVolume: 0, midPrice: 0, bestBid: 0, bestAsk: 0 });
  const [timer, setTimer] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const wsRef = useRef(null);
  const wallTimersRef = useRef(new Map());
  const timerRef = useRef(null);
  const fallbackIntervalRef = useRef(null);

  const reconnectTimeoutRef = useRef(null);
  const reconnectCountRef = useRef(0);

  // Fallback на REST API при проблемах с WebSocket
  const startRestFallback = (symbol) => {
    console.log(`Starting REST API fallback for ${symbol}`);
    setConnectionStatus('fallback');
    
    // Очищаем предыдущий интервал
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
    }
    
    // Добавляем задержку перед первым запросом
    const startDelay = Math.random() * 2000; // 0-2 секунды
    
    setTimeout(() => {
      // Получаем данные каждые 5 секунд через REST API (еще меньше нагрузки)
      fallbackIntervalRef.current = setInterval(async () => {
        try {
          const orderbookData = await binanceService.getOrderBook(symbol, 10); // Уменьшили глубину
          
          if (orderbookData && orderbookData.bids && orderbookData.asks) {
            const newDepth = { 
              bids: orderbookData.bids, 
              asks: orderbookData.asks, 
              lastUpdateId: orderbookData.lastUpdateId || Date.now()
            };
            
            setDepth(newDepth);
            analyzeWalls(newDepth);
          } else {
            console.warn(`Invalid orderbook data for ${symbol}:`, orderbookData);
          }
        } catch (error) {
          console.error(`REST API fallback error for ${symbol}:`, error);
          
          // При критической ошибке переходим на мок-данные
          if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            console.log(`Network error detected for ${symbol}, using mock data`);
            const mockData = binanceService.generateMockOrderbook(symbol);
            setDepth(mockData);
            analyzeWalls(mockData);
          }
        }
      }, 5000); // Увеличиваем интервал до 5 секунд
    }, startDelay);

    // Запускаем таймер если его нет
    if (!timerRef.current) {
      setTimer(0);
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
  };

  const connectWebSocket = (symbol) => {
    if (!symbol) return;
    
    const lower = symbol.toLowerCase();
    const url = `wss://stream.binance.com:9443/ws/${lower}@depth20@100ms`;

    // Закрываем существующее соединение
    if (wsRef.current) {
      try { 
        wsRef.current.close(); 
      } catch (e) {
        console.log('Close websocket error:', e);
      }
    }

    // Добавляем случайную задержку для избежания одновременных подключений
    const randomDelay = Math.random() * 1000; // 0-1 секунда
    
    setTimeout(() => {
      console.log(`Connecting to orderbook stream: ${symbol}`);
      
      const ws = new WebSocket(url);
      wsRef.current = ws;

    ws.onopen = () => {
      console.log(`WebSocket connected: ${symbol}`);
      setConnectionStatus('connected');
      reconnectCountRef.current = 0; // Сбрасываем счетчик при успешном подключении
      
      // Запускаем таймер
      setTimer(0);
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Проверяем структуру данных
        if (!data.bids || !data.asks || !Array.isArray(data.bids) || !Array.isArray(data.asks)) {
          console.warn('Invalid orderbook data format:', data);
          return;
        }

        const newDepth = { 
          bids: data.bids, 
          asks: data.asks, 
          lastUpdateId: data.lastUpdateId || 0 
        };
        
        setDepth(newDepth);
        analyzeWalls(newDepth);
      } catch (error) {
        console.error('WebSocket data parsing error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for ${symbol}:`, {
        readyState: ws.readyState,
        url: ws.url,
        error: error
      });
      setConnectionStatus('error');
    };

    ws.onclose = (event) => {
      const closeReasons = {
        1000: 'Normal Closure',
        1001: 'Going Away', 
        1002: 'Protocol Error',
        1003: 'Unsupported Data',
        1004: 'Reserved',
        1005: 'No Status Received',
        1006: 'Abnormal Closure',
        1007: 'Invalid frame payload data',
        1008: 'Policy Violation',
        1009: 'Message too big',
        1010: 'Missing Extension',
        1011: 'Internal Error',
        1012: 'Service Restart',
        1013: 'Try Again Later',
        1014: 'Bad Gateway',
        1015: 'TLS Handshake'
      };

      const reason = closeReasons[event.code] || 'Unknown';
      console.log(`WebSocket closed for ${symbol}: ${event.code} (${reason})`);
      
      setConnectionStatus('disconnected');
      
      // Останавливаем таймер
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Для кода 1006 (Abnormal Closure) сразу переходим на REST API после 2 попыток
      const maxAttempts = event.code === 1006 ? 2 : 5;
      
      if (reconnectCountRef.current < maxAttempts) {
        // Увеличиваем базовую задержку для кода 1006
        const baseDelay = event.code === 1006 ? 3000 : 1000;
        const delay = Math.min(baseDelay * Math.pow(2, reconnectCountRef.current), 30000);
        
        reconnectCountRef.current++;
        
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current}/${maxAttempts}) - Reason: ${reason}`);
        setConnectionStatus('reconnecting');
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket(symbol);
        }, delay);
      } else {
        console.log(`Max WebSocket reconnection attempts reached for ${symbol} (${reason}), switching to REST API fallback`);
        startRestFallback(symbol);
      }
    };
    }, randomDelay);
  };

  useEffect(() => {
    connectWebSocket(symbol);

    return () => { 
      // Очищаем таймеры переподключения
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Останавливаем таймер
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Останавливаем REST fallback
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
      }
      
      // Закрываем WebSocket
      if (wsRef.current) {
        try { 
          wsRef.current.close(); 
        } catch (e) {
          console.log('Cleanup websocket error:', e);
        }
      }
      
      // Очищаем таймеры стенок
      wallTimersRef.current.clear();
    };
  }, [symbol]);

  // Анализ стенок в orderbook
  const analyzeWalls = (depthData) => {
    const { bids, asks } = depthData;
    
    if (!bids.length || !asks.length) return;

    // Конвертируем в числа и рассчитываем объемы
    const bidData = bids.map(([price, qty]) => ({
      price: toNum(price),
      quantity: toNum(qty),
      total: toNum(price) * toNum(qty)
    }));

    const askData = asks.map(([price, qty]) => ({
      price: toNum(price),
      quantity: toNum(qty),
      total: toNum(price) * toNum(qty)
    }));

    // Текущая цена (mid)
    const bestBid = bidData[0]?.price || 0;
    const bestAsk = askData[0]?.price || 0;
    const midPrice = (bestBid + bestAsk) / 2;

    // Определяем стенки (заявки больше медианного объема * 2)
    const allVolumes = [...bidData, ...askData].map(item => item.total);
    const medianVol = median(allVolumes);
    const wallThreshold = medianVol * 1.5; // Порог для определения стенки

    const bidWalls = bidData.filter(item => item.total >= wallThreshold).map(item => ({
      ...item,
      side: 'bid',
      distancePercent: ((midPrice - item.price) / midPrice * 100),
      id: `${symbol}-bid-${item.price}`
    }));

    const askWalls = askData.filter(item => item.total >= wallThreshold).map(item => ({
      ...item,
      side: 'ask',
      distancePercent: ((item.price - midPrice) / midPrice * 100),
      id: `${symbol}-ask-${item.price}`
    }));

    // Обновляем таймеры жизни стенок
    const currentTime = Date.now();
    const currentWallIds = new Set([...bidWalls, ...askWalls].map(w => w.id));
    
    // Добавляем новые стенки в таймер
    [...bidWalls, ...askWalls].forEach(wall => {
      if (!wallTimersRef.current.has(wall.id)) {
        wallTimersRef.current.set(wall.id, currentTime);
      }
    });

    // Удаляем исчезнувшие стенки
    for (const [wallId, startTime] of wallTimersRef.current.entries()) {
      if (!currentWallIds.has(wallId)) {
        wallTimersRef.current.delete(wallId);
      }
    }

    // Добавляем время жизни к стенкам
    const bidWallsWithTimer = bidWalls.map(wall => ({
      ...wall,
      lifeTime: Math.floor((currentTime - (wallTimersRef.current.get(wall.id) || currentTime)) / 1000)
    }));

    const askWallsWithTimer = askWalls.map(wall => ({
      ...wall,
      lifeTime: Math.floor((currentTime - (wallTimersRef.current.get(wall.id) || currentTime)) / 1000)
    }));

    const maxWall = Math.max(...allVolumes);

    setWalls({ bidWalls: bidWallsWithTimer, askWalls: askWallsWithTimer });
    setStats({
      bidCount: bidWallsWithTimer.length,
      askCount: askWallsWithTimer.length,
      maxWall,
      medianVolume: medianVol,
      midPrice,
      bestBid,
      bestAsk
    });
  };

  return { depth, walls, stats, fmt, toNum, timer, connectionStatus };
}

// Утилита для форматирования времени
export function secsToHMS(sec) {
  if (!sec || sec < 0) return "0s";
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  if (h) return `${h}h ${m}m ${s}s`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}