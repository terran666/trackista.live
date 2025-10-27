import React, { useState } from 'react';
import { useBinanceScreener, useBinanceFutures } from '../hooks/useBinanceQuery';
import { formatPrice, formatVolume, formatPercent, getPriceChangeColor } from '../utils/cryptoUtils';
import KLineChart from './KLineChart';

export default function ScreenerPage1() {
  const [isCompactView, setIsCompactView] = useState(true);
  const [coinIntervals, setCoinIntervals] = useState({});
  const [showVolume, setShowVolume] = useState(false);
  const [showVolume2, setShowVolume2] = useState(false);
  const [showDump, setShowDump] = useState(false);
  const [activeTab, setActiveTab] = useState('spot');
  const [watchedCoins, setWatchedCoins] = useState({});
  const [colorPopup, setColorPopup] = useState({ show: false, coinId: null });

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

  // Цвета для отслеживания
  const watchColors = [
    { name: 'Красный', value: '#dc3545' },
    { name: 'Зеленый', value: '#28a745' },
    { name: 'Синий', value: '#007bff' },
    { name: 'Желтый', value: '#ffc107' },
    { name: 'Оранжевый', value: '#fd7e14' },
    { name: 'Фиолетовый', value: '#6f42c1' },
    { name: 'Розовый', value: '#e83e8c' },
    { name: 'Серый', value: '#6c757d' }
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

  // Функции для работы с цветами отслеживания
  const setWatchColor = (coinId, color) => {
    setWatchedCoins(prev => ({
      ...prev,
      [coinId]: color.value
    }));
    setColorPopup({ show: false, coinId: null });
  };

  const removeWatch = (coinId) => {
    setWatchedCoins(prev => {
      const newWatched = { ...prev };
      delete newWatched[coinId];
      return newWatched;
    });
    setColorPopup({ show: false, coinId: null });
  };

  // Получаем данные для скринера
  const { data: spotCoins, isLoading: spotLoading, error: spotError } = useBinanceScreener(2000);
  const { data: futuresCoins, isLoading: futuresLoading, error: futuresError } = useBinanceFutures(1000);
  
  // Выбираем данные в зависимости от активной вкладки
  const allCoins = activeTab === 'spot' ? spotCoins : futuresCoins;
  const loading = activeTab === 'spot' ? spotLoading : futuresLoading;
  const error = activeTab === 'spot' ? spotError : futuresError;

  // Фильтруем ТОП-10 монет по объему
  const topCoins = React.useMemo(() => {
    if (!allCoins || !Array.isArray(allCoins)) return [];
    
    return allCoins
      .filter(coin => coin && coin.symbol && coin.quoteVolume)
      .sort((a, b) => (b.quoteVolume || 0) - (a.quoteVolume || 0))
      .slice(0, 10);
  }, [allCoins]);

  const screenerCoins = topCoins;

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPopup.show && !event.target.closest('.position-relative')) {
        setColorPopup({ show: false, coinId: null });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [colorPopup.show]);

  return (
    <div className="container-fluid p-lg-4 p-0 screener1-page pb-5">
      {/* Заголовок и управление */}
      <div className="d-flex justify-content-end align-items-center mb-lg-4 mb-3 px-lg-4 px-2 px-sm-0">
        
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

      {/* Блок с графиками для скринера */}
      {loading && (
        <div className="text-center my-5 px-lg-4 px-2">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
          <div className="mt-2">Загрузка данных монет...</div>
        </div>
      )}

      {error && (
        <div className="alert alert-warning mx-lg-4 mx-2" role="alert">
          <h4 className="alert-heading">Ошибка подключения к Binance API</h4>
          <p>Не удается загрузить данные. Убедитесь, что прокси-сервер запущен:</p>
          <code>npm run proxy</code>
        </div>
      )}

      {/* Графики монет для скринера */}
      {screenerCoins.length > 0 && (
        <div className={`row ${isCompactView ? 'g-lg-3 g-0' : 'g-0 g-md-3'}`}>
          {screenerCoins.map((coin, index) => (
            <div key={coin.id} className={isCompactView ? "col-12 col-lg-6" : "col-12"}>
              <div className="card" style={{ border: '3px solid #adb5bd', borderRadius: '0.75rem', boxShadow: 'none', outline: 'none', backgroundColor: '#ffffff', margin: '12px 0', overflow: 'hidden' }}>
                <div className="card-body p-0 px-md-3" style={{ border: 'none', boxShadow: 'none', outline: 'none' }}>
                  {/* График сверху */}
                  <div className="density-chart-container position-relative" style={{ height: isCompactView ? '350px' : '450px', margin: 0, padding: 0, borderRadius: 0, border: 'none', boxShadow: 'none', outline: 'none' }}>
                    {/* Название тикера поверх графика */}
                    <div className="position-absolute" style={{ 
                      top: '10px', 
                      left: '15px', 
                      zIndex: 10,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#0d6efd'
                    }}>
                      {coin.symbol}
                    </div>

                    {/* Цветная точка для отслеживания */}
                    <div 
                      className="position-absolute" 
                      style={{ 
                        top: '10px', 
                        right: '10px', 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        backgroundColor: watchedCoins[coin.id] || '#6c757d',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        zIndex: 10
                      }}
                      title="Изменить цвет отслеживания"
                      onClick={(e) => {
                        e.stopPropagation();
                        setColorPopup({ show: true, coinId: coin.id });
                      }}
                    />
                    
                    <KLineChart 
                      symbol={coin.id}
                      interval={getCoinInterval(coin.id)}
                      spot={activeTab === 'spot'}
                      compact={isCompactView}
                      showMidLine={false}
                      showVolume={showVolume}
                      showVolume2={showVolume2}
                    />
                  </div>
                  
                  {/* Блок анализа под графиком */}
                  <div style={{ border: 'none', borderTop: 'none' }}>
                    <div className={isCompactView ? "p-1" : "p-2"} style={{ paddingTop: '0rem', paddingBottom: '0.2rem' }}>
                      {/* Блок данных скринера */}
                      <div className="rounded py-2 px-2" style={{ backgroundColor: '#ffffff', fontSize: '1.1rem' }}>
                        <div className="row g-1">
                          <div className="col-12 mb-1">
                            {/* Обычная таблица для десктопа */}
                            <div className="d-none d-md-block">
                              <table className="table table-borderless table-sm mb-0">
                                <tbody>
                                  <tr>
                                    <td style={{ fontSize: '1.2rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-dark">Цена</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-dark">Изменение</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-dark">Объем</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-dark">RSI</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-dark">MACD</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-dark">Сигнал</td>
                                  </tr>
                                  <tr>
                                    <td style={{ fontSize: '1.3rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-dark fw-bold">${formatPrice(coin.price)}</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className={`fw-bold ${getPriceChangeColor(coin.changePercent)}`}>
                                      {formatPercent(coin.changePercent)}
                                    </td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-dark">{formatVolume(coin.quoteVolume)}</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-success fw-bold">65</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-success fw-bold">0.015</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-success fw-bold">BUY</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            {/* Компактная таблица для мобильных */}
                            <div className="d-md-none">
                              <table className="table table-borderless table-sm mb-0" style={{ tableLayout: 'fixed', width: '100%' }}>
                                <thead>
                                  <tr>
                                    <th style={{ padding: '6px 4px', textAlign: 'left', verticalAlign: 'middle', border: 'none', width: '25%' }} className="text-dark fw-bold">Цена</th>
                                    <th style={{ padding: '6px 4px', textAlign: 'left', verticalAlign: 'middle', border: 'none', width: '25%' }} className="text-dark fw-bold">Изменение</th>
                                    <th style={{ padding: '6px 4px', textAlign: 'left', verticalAlign: 'middle', border: 'none', width: '25%' }} className="text-dark fw-bold">Объем</th>
                                    <th style={{ padding: '6px 4px', textAlign: 'left', verticalAlign: 'middle', border: 'none', width: '25%' }} className="text-dark fw-bold">RSI</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td style={{ padding: '8px 4px', textAlign: 'left', verticalAlign: 'middle', border: 'none', fontSize: '0.9rem' }} className="text-dark fw-bold">${formatPrice(coin.price)}</td>
                                    <td style={{ padding: '8px 4px', textAlign: 'left', verticalAlign: 'middle', border: 'none', fontSize: '0.9rem' }} className={`fw-bold ${getPriceChangeColor(coin.changePercent)}`}>
                                      {formatPercent(coin.changePercent)}
                                    </td>
                                    <td style={{ padding: '8px 4px', textAlign: 'left', verticalAlign: 'middle', border: 'none', fontSize: '0.9rem' }} className="text-dark">{formatVolume(coin.quoteVolume)}</td>
                                    <td style={{ padding: '8px 4px', textAlign: 'left', verticalAlign: 'middle', border: 'none', fontSize: '0.9rem' }} className="text-success fw-bold">65</td>
                                  </tr>
                                </tbody>
                              </table>
                              
                              <table className="table table-borderless table-sm mb-0 mt-2" style={{ tableLayout: 'fixed', width: '100%' }}>
                                <thead>
                                  <tr>
                                    <th style={{ padding: '6px 4px', textAlign: 'left', verticalAlign: 'middle', border: 'none', width: '25%' }} className="text-dark fw-bold">MACD</th>
                                    <th style={{ padding: '6px 4px', textAlign: 'left', verticalAlign: 'middle', border: 'none', width: '25%' }} className="text-dark fw-bold">Сигнал</th>
                                    <th style={{ padding: '6px 4px', textAlign: 'left', verticalAlign: 'middle', border: 'none', width: '25%' }} className="text-dark fw-bold">Тренд</th>
                                    <th style={{ padding: '6px 4px', textAlign: 'left', verticalAlign: 'middle', border: 'none', width: '25%' }} className="text-dark fw-bold"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td style={{ padding: '8px 4px', textAlign: 'left', verticalAlign: 'middle', border: 'none', fontSize: '0.9rem' }} className="text-success fw-bold">0.015</td>
                                    <td style={{ padding: '8px 4px', textAlign: 'left', verticalAlign: 'middle', border: 'none', fontSize: '0.9rem' }} className="text-success fw-bold">BUY</td>
                                    <td style={{ padding: '8px 4px', textAlign: 'left', verticalAlign: 'middle', border: 'none', fontSize: '0.9rem' }} className="text-success fw-bold">↗</td>
                                    <td style={{ padding: '8px 4px', textAlign: 'left', verticalAlign: 'middle', border: 'none', fontSize: '0.9rem' }}></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                          
                          <div className="col-lg-12 col-12 mb-1">
                            <div className="progress mb-2 mt-2" style={{ height: '20px', position: 'relative' }}>
                              <div 
                                className="progress-bar bg-success" 
                                role="progressbar" 
                                style={{ width: '65%' }}
                              >
                                <span className="text-white fw-bold">RSI: 65</span>
                              </div>
                              <span className="text-dark fw-bold position-absolute" style={{ right: '8px', top: '50%', transform: 'translateY(-50%)' }}>Overbought</span>
                            </div>
                            
                            <div className="progress mb-3 mt-2" style={{ height: '20px', position: 'relative' }}>
                              <div 
                                className="progress-bar bg-success" 
                                role="progressbar" 
                                style={{ width: '78%' }}
                              >
                                <span className="text-white fw-bold">78%</span>
                              </div>
                              <span className="text-dark fw-bold position-absolute" style={{ right: '8px', top: '50%', transform: 'translateY(-50%)' }}>Bullish Signal</span>
                            </div>
                            
                            {/* Кнопки управления */}
                            <div className="container-fluid px-0 mt-3 mb-2">
                              <div className="row g-2 align-items-center justify-content-between">
                                <div className="col-12 col-md-auto">
                                  <div className="d-flex flex-wrap gap-1 align-items-center">
                                    {/* Таймфреймы */}
                                    <div className="btn-group btn-group-sm flex-wrap" role="group">
                                      {timeframes.map((tf) => (
                                        <button
                                          key={tf.value}
                                          type="button"
                                          className={`btn btn-sm ${getCoinInterval(coin.id) === tf.value ? 'btn-primary' : 'btn-outline-primary'}`}
                                          onClick={() => setCoinInterval(coin.id, tf.value)}
                                          style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                                        >
                                          {tf.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="col-12 col-md-auto mt-md-0">
                                  {/* Кнопка слежения */}
                                  <div className="position-relative d-flex justify-content-end justify-content-md-start">
                                    <button 
                                      className="btn btn-outline-info btn-sm d-flex align-items-center gap-1" 
                                      style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setColorPopup({ show: !colorPopup.show && colorPopup.coinId === coin.id ? false : true, coinId: coin.id });
                                      }}
                                    >
                                      <div 
                                        style={{ 
                                          width: '10px', 
                                          height: '10px', 
                                          borderRadius: '50%', 
                                          backgroundColor: watchedCoins[coin.id] || '#6c757d',
                                          border: '1px solid white' 
                                        }}
                                      />
                                      Watch
                                    </button>
                                    
                                    {/* Попап выбора цвета */}
                                    {colorPopup.show && colorPopup.coinId === coin.id && (
                                      <div className="position-absolute bg-white border rounded shadow-lg p-2" style={{ 
                                        top: '100%', 
                                        right: '0', 
                                        zIndex: 999,
                                        marginTop: '4px',
                                        minWidth: '150px'
                                      }}>
                                        <div className="mb-2">
                                          <small className="text-dark fw-bold">Выберите цвет:</small>
                                        </div>
                                        <div className="d-flex flex-wrap gap-2 mb-2">
                                          {watchColors.map((color, idx) => (
                                            <div
                                              key={idx}
                                              className="border"
                                              title={color.name}
                                              style={{ 
                                                width: '25px', 
                                                height: '25px', 
                                                backgroundColor: color.value,
                                                cursor: 'pointer',
                                                borderRadius: '4px'
                                              }}
                                              onClick={() => setWatchColor(coin.id, color)}
                                            ></div>
                                          ))}
                                        </div>
                                        {watchedCoins[coin.id] && (
                                          <button 
                                            className="btn btn-sm btn-outline-secondary w-100"
                                            onClick={() => removeWatch(coin.id)}
                                          >
                                            Убрать метку
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}