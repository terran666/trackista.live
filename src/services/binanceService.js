import axios from 'axios';

class BinanceService {
  constructor() {
    // Публичный API Binance
    this.baseURL = 'https://api.binance.com/api/v3';
    this.wsURL = 'wss://stream.binance.com:9443/ws';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    });
  }

  // Получить информацию о торговых парах
  async getExchangeInfo() {
    try {
      const response = await this.api.get('/exchangeInfo');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения информации о бирже:', error);
      throw error;
    }
  }

  // Получить текущие цены всех символов
  async getAllPrices() {
    try {
      const response = await this.api.get('/ticker/price');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения цен:', error);
      throw error;
    }
  }

  // Получить 24-часовую статистику по всем символам
  async get24hrStats() {
    try {
      const response = await this.api.get('/ticker/24hr');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения 24h статистики:', error);
      throw error;
    }
  }

  // Получить 24-часовую статистику для конкретного символа
  async get24hrStatsBySymbol(symbol) {
    try {
      const response = await this.api.get(`/ticker/24hr?symbol=${symbol}`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка получения статистики для ${symbol}:`, error);
      throw error;
    }
  }

  // Получить все криптовалюты USDT пары
  async getTopCryptos(limit = 2000) {
    try {
      const stats = await this.get24hrStats();
      
      // Фильтруем только USDT пары и исключаем левереджные токены
      const usdtPairs = stats.filter(item => 
        item.symbol.endsWith('USDT') && 
        !item.symbol.includes('UP') && 
        !item.symbol.includes('DOWN') && 
        !item.symbol.includes('BULL') && 
        !item.symbol.includes('BEAR') &&
        !item.symbol.includes('3L') &&
        !item.symbol.includes('3S') &&
        !item.symbol.includes('5L') &&
        !item.symbol.includes('5S') &&
        parseFloat(item.quoteVolume) > 0 // Исключаем монеты с нулевым объемом
      );

      // Сортируем по объему торгов за 24 часа
      const sorted = usdtPairs.sort((a, b) => 
        parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume)
      );

      // Возвращаем все или ограниченное количество
      return limit > 0 ? sorted.slice(0, limit) : sorted;
    } catch (error) {
      console.error('Ошибка получения криптовалют:', error);
      throw error;
    }
  }

  // Получить данные для скринера (отформатированные данные)
  async getScreenerData(limit = 100) {
    try {
      const topCryptos = await this.getTopCryptos(limit);
      
      return topCryptos.map(crypto => ({
        id: crypto.symbol,
        symbol: crypto.symbol.replace('USDT', ''),
        name: crypto.symbol.replace('USDT', '/USDT'),
        price: parseFloat(crypto.lastPrice),
        change: parseFloat(crypto.priceChange),
        changePercent: parseFloat(crypto.priceChangePercent),
        volume: parseFloat(crypto.volume),
        quoteVolume: parseFloat(crypto.quoteVolume),
        high24h: parseFloat(crypto.highPrice),
        low24h: parseFloat(crypto.lowPrice),
        openPrice: parseFloat(crypto.openPrice),
        count: crypto.count,
        exchange: 'Binance',
        sector: 'Cryptocurrency',
        lastUpdate: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Ошибка получения данных для скринера:', error);
      throw error;
    }
  }

  // Получить конкретную криптовалюту по символу
  async getCryptoBySymbol(symbol) {
    try {
      const fullSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;
      const data = await this.get24hrStatsBySymbol(fullSymbol);
      
      return {
        id: data.symbol,
        symbol: data.symbol.replace('USDT', ''),
        name: data.symbol.replace('USDT', '/USDT'),
        price: parseFloat(data.lastPrice),
        change: parseFloat(data.priceChange),
        changePercent: parseFloat(data.priceChangePercent),
        volume: parseFloat(data.volume),
        quoteVolume: parseFloat(data.quoteVolume),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        openPrice: parseFloat(data.openPrice),
        count: data.count,
        exchange: 'Binance',
        sector: 'Cryptocurrency',
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Ошибка получения данных для ${symbol}:`, error);
      throw error;
    }
  }

  // Создать WebSocket соединение для получения данных в реальном времени
  createWebSocket(symbols, callback) {
    if (!Array.isArray(symbols)) {
      symbols = [symbols];
    }

    const streams = symbols.map(symbol => 
      `${symbol.toLowerCase()}usdt@ticker`
    ).join('/');

    const ws = new WebSocket(`${this.wsURL}/${streams}`);
    
    ws.onopen = () => {
      console.log('WebSocket соединение установлено');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (Array.isArray(data)) {
          // Множественные потоки
          data.forEach(item => callback(this.formatWebSocketData(item)));
        } else {
          // Одиночный поток
          callback(this.formatWebSocketData(data));
        }
      } catch (error) {
        console.error('Ошибка обработки WebSocket данных:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket ошибка:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket соединение закрыто');
    };

    return ws;
  }

  // Форматировать данные WebSocket
  formatWebSocketData(data) {
    return {
      symbol: data.s.replace('USDT', ''),
      price: parseFloat(data.c),
      change: parseFloat(data.P),
      volume: parseFloat(data.v),
      quoteVolume: parseFloat(data.q),
      high: parseFloat(data.h),
      low: parseFloat(data.l),
      timestamp: data.E
    };
  }

  // Получить orderbook для символа
  async getOrderBook(symbol, limit = 20) {
    try {
      const response = await this.api.get('/depth', {
        params: {
          symbol: symbol.toUpperCase(),
          limit: limit
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Ошибка получения orderbook для ${symbol}:`, error);
      
      // Возвращаем мок-данные в случае ошибки
      return this.generateMockOrderbook(symbol);
    }
  }

  // Генерация мок-данных для orderbook
  generateMockOrderbook(symbol) {
    // Определяем базовые цены для разных символов
    const basePrices = {
      'BTCUSDT': 43000,
      'ETHUSDT': 2400,
      'BNBUSDT': 310,
      'ADAUSDT': 0.45,
      'DOGEUSDT': 0.08,
      'XRPUSDT': 0.52
    };
    
    const basePrice = basePrices[symbol.toUpperCase()] || 1.0;
    const spread = basePrice * 0.0008; // 0.08% спред
    
    const bids = [];
    const asks = [];
    
    // Генерируем 20 уровней bid и ask с реалистичными объемами
    for (let i = 0; i < 20; i++) {
      const bidPrice = basePrice - spread/2 - (i * basePrice * 0.0003);
      const askPrice = basePrice + spread/2 + (i * basePrice * 0.0003);
      
      // Объемы убывают с каждым уровнем
      const baseVolume = Math.random() * 5 + 0.5;
      const bidVolume = (baseVolume * (1 - i * 0.05)).toFixed(8);
      const askVolume = (baseVolume * (1 - i * 0.05)).toFixed(8);
      
      // Определяем количество знаков после запятой в зависимости от цены
      const decimals = basePrice > 1000 ? 2 : basePrice > 1 ? 4 : 8;
      
      bids.push([bidPrice.toFixed(decimals), bidVolume]);
      asks.push([askPrice.toFixed(decimals), askVolume]);
    }
    
    return {
      lastUpdateId: Date.now(),
      bids,
      asks
    };
  }
}

// Создаем единственный инстанс сервиса
const binanceService = new BinanceService();

export default binanceService;