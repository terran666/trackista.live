import { useState, useEffect, useCallback } from 'react';
import binanceService from '../services/binanceService';
import binanceFuturesService from '../services/binanceFuturesService';

// Хук для получения данных скринера с Binance
export function useBinanceScreener(limit = 100) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const screenerData = await binanceService.getScreenerData(limit);
      setData(screenerData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message || 'Ошибка загрузки данных');
      console.error('Ошибка загрузки данных Binance:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refetch: fetchData
  };
}

// Хук для получения данных конкретной криптовалюты
export function useBinanceCrypto(symbol) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCrypto = useCallback(async () => {
    if (!symbol) return;

    try {
      setLoading(true);
      setError(null);
      
      const cryptoData = await binanceService.getCryptoBySymbol(symbol);
      setData(cryptoData);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки данных');
      console.error(`Ошибка загрузки ${symbol}:`, err);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchCrypto();
  }, [fetchCrypto]);

  return {
    data,
    loading,
    error,
    refetch: fetchCrypto
  };
}

// Хук для WebSocket соединения
export function useBinanceWebSocket(symbols, enabled = true) {
  const [data, setData] = useState({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !symbols || symbols.length === 0) {
      return;
    }

    let ws = null;

    try {
      ws = binanceService.createWebSocket(symbols, (wsData) => {
        setData(prevData => ({
          ...prevData,
          [wsData.symbol]: wsData
        }));
      });

      ws.onopen = () => {
        setConnected(true);
        setError(null);
      };

      ws.onerror = (err) => {
        setError('WebSocket ошибка соединения');
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
      };

    } catch (err) {
      setError(err.message);
      console.error('Ошибка создания WebSocket:', err);
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [symbols, enabled]);

  return {
    data,
    connected,
    error
  };
}

// Хук для получения фьючерсных данных
export function useBinanceFutures(limit = 100) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const futuresData = await binanceFuturesService.getFuturesScreenerData(limit);
      setData(futuresData);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки фьючерсов');
      console.error('Ошибка загрузки фьючерсов:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}