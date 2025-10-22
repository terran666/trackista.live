import React from 'react';
import { useBinanceScreener, useBinanceFutures } from '../hooks/useBinanceQuery';
import { formatPrice, formatVolume, formatPercent, getPriceChangeColor } from '../utils/cryptoUtils';
import KLineChart from './KLineChart';

export default function ScreenerPage() {
  const [activeTab, setActiveTab] = React.useState('spot');
  const [isCompactView, setIsCompactView] = React.useState(true); // По умолчанию двойной ряд активен
  const [coinIntervals, setCoinIntervals] = React.useState({});

  // Доступные таймфреймы для скринера
  const timeframes = [
    { value: '1m', label: '1м' },
    { value: '5m', label: '5м' },
    { value: '15m', label: '15м' },
    { value: '30m', label: '30м' },
    { value: '1h', label: '1ч' },
    { value: '4h', label: '4ч' },
    { value: '1d', label: '1д' }
  ];

  // Функция для переключения компактного вида
  const toggleCompactView = () => {
    setIsCompactView(!isCompactView);
  };

  // Функция для получения интервала конкретной монеты
  const getCoinInterval = (coinId) => {
    return coinIntervals[coinId] || '5m';
  };

  // Функция для установки интервала конкретной монеты
  const setCoinInterval = (coinId, interval) => {
    setCoinIntervals(prev => ({
      ...prev,
      [coinId]: interval
    }));
  };

  // Получаем данные в зависимости от активной вкладки с TanStack Query
  const { data: spotCoins, isLoading: spotLoading, error: spotError } = useBinanceScreener(2000);
  const { data: futuresCoins, isLoading: futuresLoading, error: futuresError } = useBinanceFutures(1000);
  
  // Выбираем данные в зависимости от активной вкладки
  const allCoins = activeTab === 'spot' ? spotCoins : futuresCoins;
  const loading = activeTab === 'spot' ? spotLoading : futuresLoading;
  const error = activeTab === 'spot' ? spotError : futuresError;
  
  // Берем топ 10 монет
  const topCoins = allCoins ? 
    allCoins
      .filter(coin => coin.id.endsWith('USDT') && coin.quoteVolume > 100000)
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 10) : [];

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
          <h5>Загрузка топ 10 монет...</h5>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger m-3">
          <h5>❌ Ошибка загрузки данных</h5>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Заголовок и кнопки */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Скринер ТОП-10</h2>
          <p className="text-muted mb-0">Анализ лучших монет с графиками</p>
        </div>
        
        {/* Кнопки управления */}
        <div className="d-flex gap-2">
          {/* Кнопка открытия главной страницы */}
          <button
            type="button"
            className="btn btn-outline-info"
            onClick={() => window.open('/', '_blank')}
            title="Открыть главную страницу в новой вкладке"
          >
            📊 Графики
          </button>
          
          {/* Кнопка компактного вида */}
          <button
            type="button"
            className={`btn ${isCompactView ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={toggleCompactView}
            title={isCompactView ? 'Обычный вид (1 в ряд)' : 'Компактный вид (2 в ряд)'}
          >
            ═
          </button>
          
          {/* Кнопки Спот/Фьючерсы */}
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn ${activeTab === 'spot' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setActiveTab('spot')}
            >
              Спот
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'futures' ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => setActiveTab('futures')}
            >
              Фьючерсы
            </button>
          </div>
        </div>
      </div>

      {/* 10 прямоугольников с данными и графиками */}
      <div className="row g-3">
        {topCoins.map((coin, index) => (
          <div key={coin.id} className={isCompactView ? "col-lg-6" : "col-12"}>
            <div className="card">
              <div className="card-body p-0">
                <div className="row g-0">
                  {/* Левая часть - данные монеты */}
                  <div className={isCompactView ? "col-md-4 border-end" : "col-md-3 border-end"}>
                    <div className={isCompactView ? "p-2" : "p-3"}>
                      <div className="d-flex align-items-center mb-2">
                        <h6 className={`mb-0 me-2 ${isCompactView ? 'fs-6' : ''}`}>#{index + 1}</h6>
                        <h5 className={`mb-0 ${isCompactView ? 'fs-6' : 'fs-4'}`}>{coin.symbol}</h5>
                      </div>
                      
                      <div className="mb-2">
                        <div className={`fw-bold ${isCompactView ? 'fs-6' : 'fs-5'}`}>${formatPrice(coin.price)}</div>
                        <div className={`${getPriceChangeColor(coin.changePercent)} fw-bold ${isCompactView ? 'small' : ''}`}>
                          {formatPercent(coin.changePercent)}
                        </div>
                      </div>
                      
                      <div className="small text-muted">
                        <div>Объем: {formatVolume(coin.quoteVolume)}</div>
                        {!isCompactView && <div>Сделки: {coin.count ? (coin.count > 1000 ? `${Math.round(coin.count/1000)}K` : coin.count.toLocaleString()) : '-'}</div>}
                        <div>Макс: ${formatPrice(coin.high24h)}</div>
                        <div>Мин: ${formatPrice(coin.low24h)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Правая часть - график */}
                  <div className={isCompactView ? "col-md-8" : "col-md-9"}>
                    {/* Меню таймфреймов для графика */}
                    <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
                      <small className="text-muted fw-bold">Таймфрейм:</small>
                      <div className="btn-group btn-group-sm" role="group">
                        {timeframes.map((tf) => (
                          <button
                            key={tf.value}
                            type="button"
                            className={`btn btn-sm ${getCoinInterval(coin.id) === tf.value ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setCoinInterval(coin.id, tf.value)}
                            style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                          >
                            {tf.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ height: isCompactView ? '170px' : '220px' }}>
                      <KLineChart 
                        symbol={coin.id}
                        interval={getCoinInterval(coin.id)}
                        spot={activeTab === 'spot'}
                        compact={true}
                        showMidLine={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {topCoins.length === 0 && (
        <div className="text-center py-5">
          <h5 className="text-muted">Нет данных</h5>
          <p className="text-muted">Не удалось загрузить топ монеты</p>
        </div>
      )}
    </div>
  );
}