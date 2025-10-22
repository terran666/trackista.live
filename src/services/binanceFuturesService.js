import axios from 'axios';

class BinanceFuturesService {
  constructor() {
    // Binance Futures API
    this.baseURL = 'https://fapi.binance.com/fapi/v1';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    });
  }

  // Получить 24-часовую статистику по фьючерсам
  async get24hrStats() {
    try {
      const response = await this.api.get('/ticker/24hr');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения фьючерсной статистики:', error);
      throw error;
    }
  }

  // Получить топ фьючерсных контрактов
  async getTopFutures(limit = 100) {
    try {
      const stats = await this.get24hrStats();
      
      // Фильтруем только USDT контракты и исключаем некоторые типы
      const usdtFutures = stats.filter(item => 
        item.symbol.endsWith('USDT') && 
        !item.symbol.includes('_') && // Исключаем кварталы
        parseFloat(item.quoteVolume) > 0
      );

      // Сортируем по объему торгов
      const sorted = usdtFutures.sort((a, b) => 
        parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume)
      );

      return sorted.slice(0, limit);
    } catch (error) {
      console.error('Ошибка получения фьючерсов:', error);
      throw error;
    }
  }

  // Получить данные фьючерсов для скринера
  async getFuturesScreenerData(limit = 100) {
    try {
      const topFutures = await this.getTopFutures(limit);
      
      return topFutures.map(future => ({
        id: future.symbol,
        symbol: future.symbol.replace('USDT', ''),
        name: future.symbol.replace('USDT', '/USDT (Futures)'),
        price: parseFloat(future.lastPrice),
        change: parseFloat(future.priceChange),
        changePercent: parseFloat(future.priceChangePercent),
        volume: parseFloat(future.volume),
        quoteVolume: parseFloat(future.quoteVolume),
        high24h: parseFloat(future.highPrice),
        low24h: parseFloat(future.lowPrice),
        openPrice: parseFloat(future.openPrice),
        count: future.count,
        exchange: 'Binance Futures',
        sector: 'Futures',
        lastUpdate: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Ошибка получения данных фьючерсов:', error);
      throw error;
    }
  }
}

const binanceFuturesService = new BinanceFuturesService();
export default binanceFuturesService;