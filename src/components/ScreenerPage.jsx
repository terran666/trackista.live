import React from 'react';
import { useBinanceScreener, useBinanceFutures } from '../hooks/useBinanceQuery';
import { formatPrice, formatVolume, formatPercent, getPriceChangeColor } from '../utils/cryptoUtils';
import KLineChart from './KLineChart';

export default function ScreenerPage() {
  const [activeTab, setActiveTab] = React.useState('spot');
  const [isCompactView, setIsCompactView] = React.useState(true); // По умолчанию двойной ряд активен
  const [coinIntervals, setCoinIntervals] = React.useState({});
  const [showVolume, setShowVolume] = React.useState(false); // Показывать объемы на графиках
  const [showVolume2, setShowVolume2] = React.useState(false); // Показывать ПАМП монеты (ТОП-7 по росту)
  const [showDump, setShowDump] = React.useState(false); // Показывать ДАМП монеты (ТОП-7 по падению)

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
  
  // Берем топ 10 монет по объему
  const topCoins = allCoins ? 
    allCoins
      .filter(coin => coin.id.endsWith('USDT') && coin.quoteVolume > 100000)
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 10) : [];

  // Берем топ 7 монет по росту за 24ч (ПАМП) - только при включенной кнопке "Объем2"
  const pampCoins = (showVolume2 && allCoins) ? 
    allCoins
      .filter(coin => coin.id.endsWith('USDT') && parseFloat(coin.changePercent) > 0)
      .sort((a, b) => parseFloat(b.changePercent) - parseFloat(a.changePercent))
      .slice(0, 7) : [];

  // Берем топ 7 монет по падению за 24ч (ДАМП) - только при включенной кнопке ДАМП
  const dumpCoins = (showDump && allCoins) ? 
    allCoins
      .filter(coin => coin.id.endsWith('USDT') && parseFloat(coin.changePercent) < 0)
      .sort((a, b) => parseFloat(a.changePercent) - parseFloat(b.changePercent))
      .slice(0, 7) : [];

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
          
          {/* Кнопка переключения объемов */}
          <button
            type="button"
            className={`btn ${showVolume ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setShowVolume(!showVolume)}
            title={showVolume ? 'Скрыть объемы на графиках' : 'Показать объемы на графиках'}
          >
            📈 Объем
          </button>
          
          {/* Кнопка ПАМП (ТОП-7 по росту за 24ч) */}
          <button
            type="button"
            className={`btn ${showVolume2 ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setShowVolume2(!showVolume2)}
            title={showVolume2 ? 'Скрыть ПАМП монеты' : 'Показать ТОП-7 ПАМП (рост за 24ч)'}
          >
            🚀 ПАМП
          </button>
          
          {/* Кнопка ДАМП (ТОП-7 по падению за 24ч) */}
          <button
            type="button"
            className={`btn ${showDump ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => setShowDump(!showDump)}
            title={showDump ? 'Скрыть ДАМП монеты' : 'Показать ТОП-7 ДАМП (падение за 24ч)'}
          >
            📉 ДАМП
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

      {/* ТОП-10 по объему + ТОП-7 ПАМП (если включено) */}
      <div className="row g-3">
        {/* Основные ТОП-10 монет по объему */}
        {topCoins.map((coin, index) => (
          <div key={coin.id} className={isCompactView ? "col-lg-6" : "col-12"}>
            <div className="card" style={{ borderRadius: 0 }}>
              <div className="card-body p-0">
                <div className="row g-0">
                  {/* Левая часть - данные монеты (снизу на мобильных) */}
                  <div className={isCompactView ? "col-12 col-md-4 border-md-end order-2 order-md-1" : "col-12 col-md-3 border-md-end order-2 order-md-1"}>
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
                      
                      {/* Меню таймфреймов перенесено в левый блок */}
                      <div className="mt-3 pt-2 border-top">
                        <small className="text-muted fw-bold d-block mb-2">Таймфрейм:</small>
                        <div className="btn-group btn-group-sm d-flex flex-wrap" role="group">
                          {timeframes.map((tf) => (
                            <button
                              key={tf.value}
                              type="button"
                              className={`btn btn-sm ${getCoinInterval(coin.id) === tf.value ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => setCoinInterval(coin.id, tf.value)}
                              style={{ fontSize: '0.6rem', padding: '1px 4px', margin: '1px' }}
                            >
                              {tf.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Правая часть - только график (сверху на мобильных) */}
                  <div className={isCompactView ? "col-12 col-md-8 order-1 order-md-2" : "col-12 col-md-9 order-1 order-md-2"} style={{ padding: 0 }}>
                    <div style={{ height: isCompactView ? '250px' : '320px', margin: 0, padding: 0, borderRadius: 0, border: 'none' }}>
                      <KLineChart 
                        symbol={coin.id}
                        interval={getCoinInterval(coin.id)}
                        spot={activeTab === 'spot'}
                        compact={true}
                        showMidLine={false}
                        showVolume={showVolume}
                        showVolume2={showVolume2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ПАМП-монеты (ТОП-7 по росту) - показываются только при включенной кнопке "Объем2" */}
        {showVolume2 && pampCoins.map((coin, index) => (
          <div key={`pamp-${coin.id}`} className={isCompactView ? "col-lg-6" : "col-12"}>
            <div className="card border-success" style={{ borderRadius: 0 }}>
              <div className="card-body p-0">
                <div className="row g-0">
                  {/* Левая часть - данные ПАМП монеты (снизу на мобильных) */}
                  <div className={isCompactView ? "col-12 col-md-4 border-md-end order-2 order-md-1" : "col-12 col-md-3 border-md-end order-2 order-md-1"}>
                    <div className={isCompactView ? "p-2" : "p-3"}>
                      <div className="d-flex align-items-center mb-2">
                        <span className="badge bg-success me-2">ПАМП</span>
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
                      
                      {/* Меню таймфреймов ПАМП перенесено в левый блок */}
                      <div className="mt-3 pt-2 border-top bg-success bg-opacity-10 rounded">
                        <small className="text-success fw-bold d-block mb-2 px-2">ПАМП Таймфрейм:</small>
                        <div className="btn-group btn-group-sm d-flex flex-wrap px-2 pb-2" role="group">
                          {timeframes.map((tf) => (
                            <button
                              key={tf.value}
                              type="button"
                              className={`btn btn-sm ${getCoinInterval(`pamp-${coin.id}`) === tf.value ? 'btn-success' : 'btn-outline-success'}`}
                              onClick={() => setCoinInterval(`pamp-${coin.id}`, tf.value)}
                              style={{ fontSize: '0.6rem', padding: '1px 4px', margin: '1px' }}
                            >
                              {tf.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Правая часть - только график ПАМП (сверху на мобильных) */}
                  <div className={isCompactView ? "col-12 col-md-8 order-1 order-md-2" : "col-12 col-md-9 order-1 order-md-2"} style={{ padding: 0 }}>
                    <div style={{ height: isCompactView ? '250px' : '320px', margin: 0, padding: 0, borderRadius: 0, border: 'none' }}>
                      <KLineChart 
                        symbol={coin.id}
                        interval={getCoinInterval(`pamp-${coin.id}`)}
                        spot={activeTab === 'spot'}
                        compact={true}
                        showMidLine={false}
                        showVolume={showVolume}
                        showVolume2={showVolume2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ДАМП-монеты (ТОП-7 по падению) - показываются только при включенной кнопке "ДАМП" */}
        {showDump && dumpCoins.map((coin, index) => (
          <div key={`dump-${coin.id}`} className={isCompactView ? "col-lg-6" : "col-12"}>
            <div className="card border-danger" style={{ borderRadius: 0 }}>
              <div className="card-body p-0">
                <div className="row g-0">
                  {/* Левая часть - данные ДАМП монеты (снизу на мобильных) */}
                  <div className={isCompactView ? "col-12 col-md-4 border-md-end order-2 order-md-1" : "col-12 col-md-3 border-md-end order-2 order-md-1"}>
                    <div className={isCompactView ? "p-2" : "p-3"}>
                      <div className="d-flex align-items-center mb-2">
                        <span className="badge bg-danger me-2">ДАМП</span>
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
                      
                      {/* Меню таймфреймов ДАМП перенесено в левый блок */}
                      <div className="mt-3 pt-2 border-top bg-danger bg-opacity-10 rounded">
                        <small className="text-danger fw-bold d-block mb-2 px-2">ДАМП Таймфрейм:</small>
                        <div className="btn-group btn-group-sm d-flex flex-wrap px-2 pb-2" role="group">
                          {timeframes.map((tf) => (
                            <button
                              key={tf.value}
                              type="button"
                              className={`btn btn-sm ${getCoinInterval(`dump-${coin.id}`) === tf.value ? 'btn-danger' : 'btn-outline-danger'}`}
                              onClick={() => setCoinInterval(`dump-${coin.id}`, tf.value)}
                              style={{ fontSize: '0.6rem', padding: '1px 4px', margin: '1px' }}
                            >
                              {tf.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Правая часть - только график ДАМП (сверху на мобильных) */}
                  <div className={isCompactView ? "col-12 col-md-8 order-1 order-md-2" : "col-12 col-md-9 order-1 order-md-2"} style={{ padding: 0 }}>
                    <div style={{ height: isCompactView ? '250px' : '320px', margin: 0, padding: 0, borderRadius: 0, border: 'none' }}>
                      <KLineChart 
                        symbol={coin.id}
                        interval={getCoinInterval(`dump-${coin.id}`)}
                        spot={activeTab === 'spot'}
                        compact={true}
                        showMidLine={false}
                        showVolume={showVolume}
                        showVolume2={showVolume2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {topCoins.length === 0 && !showVolume2 && !showDump && (
        <div className="text-center py-5">
          <h5 className="text-muted">Нет данных</h5>
          <p className="text-muted">Не удалось загрузить топ монеты</p>
        </div>
      )}

      {showVolume2 && pampCoins.length === 0 && (
        <div className="text-center py-3">
          <div className="alert alert-warning">
            <h6 className="text-warning">⚠️ ПАМП монеты не найдены</h6>
            <p className="mb-0 small">Нет монет с положительным ростом за 24ч</p>
          </div>
        </div>
      )}
    </div>
  );
}