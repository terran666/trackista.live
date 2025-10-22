// Форматирование чисел для отображения
export const formatPrice = (price, decimals = 2) => {
  if (price === null || price === undefined) return '-';
  
  if (price < 0.01) {
    return price.toFixed(6);
  } else if (price < 1) {
    return price.toFixed(4);
  } else if (price < 100) {
    return price.toFixed(2);
  } else {
    return price.toFixed(decimals);
  }
};

// Форматирование объема торгов
export const formatVolume = (volume) => {
  if (volume === null || volume === undefined) return '-';
  
  if (volume >= 1000000000) {
    return `${(volume / 1000000000).toFixed(2)}B`;
  } else if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(2)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(2)}K`;
  } else {
    return volume.toFixed(2);
  }
};

// Форматирование процентного изменения
export const formatPercent = (percent, decimals = 2) => {
  if (percent === null || percent === undefined) return '-';
  
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(decimals)}%`;
};

// Получить цвет для изменения цены
export const getPriceChangeColor = (change) => {
  if (change > 0) return 'text-success';
  if (change < 0) return 'text-danger';
  return 'text-muted';
};

// Фильтрация криптовалют по различным параметрам
export const filterCryptos = (cryptos, filters) => {
  return cryptos.filter(crypto => {
    // Поиск по символу или названию
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!crypto.symbol.toLowerCase().includes(searchLower) && 
          !crypto.name.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Фильтр по минимальной цене
    if (filters.minPrice && crypto.price < parseFloat(filters.minPrice)) {
      return false;
    }

    // Фильтр по максимальной цене
    if (filters.maxPrice && crypto.price > parseFloat(filters.maxPrice)) {
      return false;
    }

    // Фильтр по минимальному объему
    if (filters.minVolume && crypto.quoteVolume < parseFloat(filters.minVolume)) {
      return false;
    }

    // Фильтр по изменению цены
    if (filters.minChange && crypto.changePercent < parseFloat(filters.minChange)) {
      return false;
    }

    if (filters.maxChange && crypto.changePercent > parseFloat(filters.maxChange)) {
      return false;
    }

    // Фильтр только растущих
    if (filters.onlyGainers && crypto.changePercent <= 0) {
      return false;
    }

    // Фильтр только падающих
    if (filters.onlyLosers && crypto.changePercent >= 0) {
      return false;
    }

    return true;
  });
};

// Сортировка криптовалют
export const sortCryptos = (cryptos, sortBy, sortOrder = 'desc') => {
  const sorted = [...cryptos].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Обработка строковых значений
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return sorted;
};

// Получить иконку криптовалюты
export const getCryptoIcon = (symbol) => {
  const baseUrl = 'https://cryptoicons.org/api/icon';
  return `${baseUrl}/${symbol.toLowerCase()}/50`;
};

// Определить категорию криптовалюты
export const getCryptoCategory = (symbol) => {
  const stablecoins = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP'];
  const defi = ['UNI', 'SUSHI', 'COMP', 'AAVE', 'MKR', 'SNX', 'YFI'];
  const layer1 = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'AVAX', 'DOT', 'MATIC'];
  const meme = ['DOGE', 'SHIB', 'PEPE', 'FLOKI'];

  if (stablecoins.includes(symbol)) return 'Stablecoin';
  if (defi.includes(symbol)) return 'DeFi';
  if (layer1.includes(symbol)) return 'Layer 1';
  if (meme.includes(symbol)) return 'Meme';
  
  return 'Other';
};

// Рассчитать RSI (упрощенная версия)
export const calculateRSI = (prices, period = 14) => {
  if (prices.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  // Рассчитываем первые gains и losses
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return rsi;
};

// Валидация символа криптовалюты
export const isValidCryptoSymbol = (symbol) => {
  const regex = /^[A-Z]{2,10}$/;
  return regex.test(symbol);
};

// Получить популярные торговые пары
export const getPopularPairs = () => {
  return [
    'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'DOGE',
    'AVAX', 'SHIB', 'MATIC', 'LTC', 'UNI', 'LINK', 'BCH', 'ALGO'
  ];
};