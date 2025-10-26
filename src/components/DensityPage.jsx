import React, { useState } from 'react';
import { useBinanceScreener, useBinanceFutures } from '../hooks/useBinanceQuery';
import { formatPrice, formatVolume, formatPercent, getPriceChangeColor } from '../utils/cryptoUtils';
import KLineChart from './KLineChart';

export default function DensityPage() {
  // VERSION: mobile-spacing-fix-v27102025
  const [isCompactView, setIsCompactView] = useState(true);
  const [isSpot, setIsSpot] = useState(true);
  const [coinIntervals, setCoinIntervals] = useState({});
  const [showVolume, setShowVolume] = useState(false);
  const [watchedCoins, setWatchedCoins] = useState({});
  const [colorPopup, setColorPopup] = useState({ show: false, coinId: null });

  // Доступные цвета для селекции
  const watchColors = [
    { name: 'Красный', value: '#dc3545', bg: 'bg-danger' },
    { name: 'Синий', value: '#0d6efd', bg: 'bg-primary' },
    { name: 'Зеленый', value: '#198754', bg: 'bg-success' },
    { name: 'Желтый', value: '#ffc107', bg: 'bg-warning' },
    { name: 'Фиолетовый', value: '#6f42c1', bg: 'bg-info' },
    { name: 'Оранжевый', value: '#fd7e14', bg: 'bg-secondary' }
  ];
  
  // Функция для установки цвета монеты
  const setWatchColor = (coinId, color) => {
    setWatchedCoins(prev => ({
      ...prev,
      [coinId]: color
    }));
    setColorPopup({ show: false, coinId: null });
  };
  
  // Функция для снятия с отслеживания
  const removeWatch = (coinId) => {
    setWatchedCoins(prev => {
      const newWatched = { ...prev };
      delete newWatched[coinId];
      return newWatched;
    });
    setColorPopup({ show: false, coinId: null });
  };

  // Закрытие попапа при клике вне его
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPopup.show && !event.target.closest('.position-relative')) {
        setColorPopup({ show: false, coinId: null });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [colorPopup.show]);

  // Доступные таймфреймы
  const timeframes = [
    { value: '1m', label: '1м' },
    { value: '5m', label: '5м' },
    { value: '15m', label: '15м' },
    { value: '30m', label: '30м' },
    { value: '1h', label: '1ч' },
    { value: '4h', label: '4ч' },
    { value: '1d', label: '1д' }
  ];

  const toggleCompactView = () => {
    setIsCompactView(!isCompactView);
  };

  const toggleMarketType = (spot) => {
    setIsSpot(spot);
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

  // Получаем данные в зависимости от активной вкладки
  const { data: spotCoins, isLoading: spotLoading, error: spotError } = useBinanceScreener(2000);
  const { data: futuresCoins, isLoading: futuresLoading, error: futuresError } = useBinanceFutures(1000);
  
  // Выбираем данные в зависимости от активной вкладки
  const allCoins = isSpot ? spotCoins : futuresCoins;
  const loading = isSpot ? spotLoading : futuresLoading;
  const error = isSpot ? spotError : futuresError;

  // Фиксированный список из 10 случайных монет для анализа плотности
  const densityCoins = React.useMemo(() => {
    if (!allCoins || allCoins.length === 0) return [];
    
    // Исключаем левереджные токены
    const filteredCoins = allCoins.filter(coin => 
      !coin.symbol.includes('UP') && 
      !coin.symbol.includes('DOWN') && 
      !coin.symbol.includes('BULL') && 
      !coin.symbol.includes('BEAR')
    );
    
    // Берем первые 10 монет (они уже отсортированы по объему)
    return filteredCoins.slice(0, 10);
  }, [allCoins]);

  return (
    <div className="container-fluid p-lg-4 p-0 density-page pb-5">
      {/* Заголовок и управление */}
      <div className="d-flex justify-content-between align-items-center mb-lg-4 mb-3 px-lg-4 px-2 px-sm-0">
        <div>
        </div>
        
        {/* Управление */}
        <div className="d-flex gap-2">
          {/* Кнопки спот/фьючерсы */}
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className={`btn ${isSpot ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => toggleMarketType(true)}
            >
              Спот
            </button>
            <button
              type="button"
              className={`btn ${!isSpot ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => toggleMarketType(false)}
            >
              Фьючерсы
            </button>
          </div>
          
          {/* Кнопка компактного вида */}
          <button
            type="button"
            className={`btn btn-sm ${isCompactView ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={toggleCompactView}
            title={isCompactView ? 'Обычный вид (1 в ряд)' : 'Компактный вид (2 в ряд)'}
          >
            ═
          </button>
          
          {/* Кнопка перезагрузки страницы */}
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => window.location.reload()}
            title="Перезагрузить страницу"
          >
            🔄
          </button>
          
          {/* Кнопка настроек */}
          <button
            type="button"
            className="btn btn-sm btn-outline-dark"
            onClick={() => console.log('Открыть настройки')}
            title="Настройки анализа плотности"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Блок с графиками для анализа плотности */}
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

      {/* Графики монет для анализа плотности */}
      {densityCoins.length > 0 && (
        <div className={`row ${isCompactView ? 'g-lg-3 g-0' : 'g-0 g-md-3'}`}>
          {densityCoins.map((coin, index) => (
            <div key={coin.id} className={isCompactView ? "col-12 col-lg-6" : "col-12"}>
              <div className="card border-0" style={{ borderRadius: 0, border: 'none', boxShadow: 'none', outline: 'none' }}>
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
                    
                    <KLineChart 
                      symbol={coin.id}
                      interval={getCoinInterval(coin.id)}
                      spot={isSpot}
                      compact={isCompactView}
                      showMidLine={false}
                      showVolume={showVolume}
                    />
                  </div>
                  
                  {/* Блок анализа DOM стенок под графиком */}
                  <div style={{ border: 'none', borderTop: 'none' }}>
                    <div className={isCompactView ? "p-1" : "p-2"} style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                      


                      {/* Блок данных по DOM стенке */}
                      <div className="border rounded p-3" style={{ backgroundColor: '#f8f9fa', fontSize: '1.1rem' }}>
                        <div className="row g-2">

                          
                          <div className="col-12 mb-2">
                            {/* Обычная таблица для десктопа */}
                            <div className="d-none d-md-block">
                              <table className="table table-borderless table-sm mb-0">
                                <tbody>
                                  <tr>
                                    <td style={{ fontSize: '1.2rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-muted">Стенка</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-muted">на цене:</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-muted">до цены:</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-muted">Съедание:</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-muted">время до:</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-muted">жизнь:</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-muted">Активность:</td>
                                  </tr>
                                  <tr>
                                    <td style={{ fontSize: '1.3rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-dark fw-bold">300т</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-dark fw-bold">2000</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="text-danger fw-bold">+2.5%</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="fw-bold">~12 мин</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="fw-bold">~45 мин</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="fw-bold">2.5ч</td>
                                    <td style={{ fontSize: '1.1rem', padding: '4px 8px', verticalAlign: 'middle' }} className="fw-bold">Высокая</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            
                            {/* Компактная таблица для мобильных */}
                            <div className="d-block d-md-none">
                              <table className="table table-borderless table-sm mb-0" style={{ fontSize: '0.8rem' }}>
                                <tbody>
                                  <tr>
                                    <td style={{ padding: '2px 4px', width: '35%' }} className="text-muted fw-bold">Стенка:</td>
                                    <td style={{ padding: '2px 4px' }} className="text-dark fw-bold">300т</td>
                                    <td style={{ padding: '2px 4px', width: '30%' }} className="text-muted fw-bold">На цене:</td>
                                    <td style={{ padding: '2px 4px' }} className="text-dark fw-bold">2000</td>
                                  </tr>
                                  <tr>
                                    <td style={{ padding: '2px 4px' }} className="text-muted fw-bold">До цены:</td>
                                    <td style={{ padding: '2px 4px' }} className="text-danger fw-bold">+2.5%</td>
                                    <td style={{ padding: '2px 4px' }} className="text-muted fw-bold">Съедание:</td>
                                    <td style={{ padding: '2px 4px' }} className="fw-bold">~12 мин</td>
                                  </tr>
                                  <tr>
                                    <td style={{ padding: '2px 4px' }} className="text-muted fw-bold">Время до:</td>
                                    <td style={{ padding: '2px 4px' }} className="fw-bold">~45 мин</td>
                                    <td style={{ padding: '2px 4px' }} className="text-muted fw-bold">Жизнь:</td>
                                    <td style={{ padding: '2px 4px' }} className="fw-bold">2.5ч</td>
                                  </tr>
                                  <tr>
                                    <td style={{ padding: '2px 4px' }} className="text-muted fw-bold">Активность:</td>
                                    <td style={{ padding: '2px 4px' }} className="fw-bold">Высокая</td>
                                    <td colSpan="2"></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                          
                          <div className="col-lg-12 col-12 mb-2">
                            <div className="progress mb-3" style={{ height: '20px', position: 'relative' }}>
                              <div 
                                className="progress-bar bg-danger" 
                                role="progressbar" 
                                style={{ width: '25%' }}
                              >
                                <span className="text-white fw-bold">25%</span>
                              </div>
                              <span className="text-muted fw-bold position-absolute" style={{ right: '8px', top: '50%', transform: 'translateY(-50%)' }}>Vol: 2.4M</span>
                            </div>
                            
                            <div className="progress mb-4" style={{ height: '20px', position: 'relative' }}>
                              <div 
                                className="progress-bar bg-success" 
                                role="progressbar" 
                                style={{ width: '72%' }}
                              >
                                <span className="text-white fw-bold">72%</span>
                              </div>
                              <span className="text-muted fw-bold position-absolute" style={{ right: '8px', top: '50%', transform: 'translateY(-50%)' }}>Вероятность пробоя</span>
                            </div>
                            
                            {/* Кнопки управления в Bootstrap контейнере */}
                            <div className="container-fluid px-0">
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
                                    
                                    {/* Кнопки торговли */}
                                    <div className="btn-group btn-group-sm ms-2" role="group">
                                      <button className="btn btn-outline-warning btn-sm" style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
                                        Futures
                                      </button>
                                      <button className="btn btn-outline-success btn-sm" style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
                                        Spot
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="col-12 col-md-auto mt-md-0">
                                  {/* Кнопка слежения */}
                                  <div className="position-relative d-flex justify-content-end justify-content-md-start">
                                    <button 
                                      className="btn btn-outline-info btn-sm d-flex align-items-center gap-1" 
                                      style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                                      onClick={() => setColorPopup({ show: true, coinId: coin.id })}
                                    >
                                      {watchedCoins[coin.id] && (
                                        <span 
                                          className="rounded-circle" 
                                          style={{ 
                                            width: '8px', 
                                            height: '8px', 
                                            backgroundColor: watchedCoins[coin.id].value,
                                            display: 'inline-block'
                                          }}
                                        ></span>
                                      )}
                                      Следить
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
                                          <small className="text-muted fw-bold">Выберите цвет:</small>
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