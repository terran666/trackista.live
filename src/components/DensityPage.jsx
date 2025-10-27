import React, { useState } from 'react';
import { useBinanceScreener, useBinanceFutures } from '../hooks/useBinanceQuery';
import { formatPrice, formatVolume, formatPercent, getPriceChangeColor } from '../utils/cryptoUtils';
import KLineChart from './KLineChart';

export default function DensityPage() {
  // VERSION: mobile-spacing-fix-v27102025
  const [isCompactView, setIsCompactView] = useState(() => {
    const saved = localStorage.getItem('density-compact-view');
    return saved ? JSON.parse(saved) : true;
  });
  const [isSpot, setIsSpot] = useState(() => {
    const saved = localStorage.getItem('density-is-spot');
    return saved ? JSON.parse(saved) : true;
  });
  const [coinIntervals, setCoinIntervals] = useState(() => {
    const saved = localStorage.getItem('density-coin-intervals');
    return saved ? JSON.parse(saved) : {};
  });
  const [showVolume, setShowVolume] = useState(() => {
    const saved = localStorage.getItem('density-show-volume');
    return saved ? JSON.parse(saved) : false;
  });
  const [watchedCoins, setWatchedCoins] = useState({});
  const [colorPopup, setColorPopup] = useState({ show: false, coinId: null });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [excludedCoins, setExcludedCoins] = useState(() => {
    const saved = localStorage.getItem('density-excluded-coins');
    return saved ? JSON.parse(saved) : [];
  });
  const [coinToExclude, setCoinToExclude] = useState('');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetToDelete, setPresetToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savedPresets, setSavedPresets] = useState(() => {
    const saved = localStorage.getItem('density-presets');
    return saved ? JSON.parse(saved) : [];
  });

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

  // Функция для добавления монеты в исключения
  const addExcludedCoin = () => {
    if (coinToExclude.trim() && !excludedCoins.includes(coinToExclude.trim().toUpperCase())) {
      setExcludedCoins(prev => [...prev, coinToExclude.trim().toUpperCase()]);
      setCoinToExclude('');
    }
  };

  // Функция для удаления монеты из исключений
  const removeExcludedCoin = (coin) => {
    setExcludedCoins(prev => prev.filter(c => c !== coin));
  };

  // Функция для сохранения пресета
  const savePreset = () => {
    if (presetName.trim() && !savedPresets.find(p => p.name === presetName.trim())) {
      const newPreset = {
        name: presetName.trim(),
        settings: {
          isCompactView,
          isSpot,
          showVolume,
          excludedCoins
        }
      };
      const updatedPresets = [...savedPresets, newPreset];
      setSavedPresets(updatedPresets);
      localStorage.setItem('density-presets', JSON.stringify(updatedPresets));
      setPresetName('');
    }
  };

  // Функция для подтверждения удаления пресета
  const confirmDeletePreset = (preset) => {
    setPresetToDelete(preset);
    setShowDeleteConfirm(true);
  };

  // Функция для удаления пресета
  const deletePreset = () => {
    if (presetToDelete) {
      const updatedPresets = savedPresets.filter(p => p.name !== presetToDelete.name);
      setSavedPresets(updatedPresets);
      localStorage.setItem('density-presets', JSON.stringify(updatedPresets));
      setPresetToDelete(null);
      setShowDeleteConfirm(false);
    }
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

  // Сохранение исключенных монет в localStorage
  React.useEffect(() => {
    localStorage.setItem('density-excluded-coins', JSON.stringify(excludedCoins));
  }, [excludedCoins]);

  // Сохранение настроек в localStorage
  React.useEffect(() => {
    localStorage.setItem('density-compact-view', JSON.stringify(isCompactView));
  }, [isCompactView]);

  React.useEffect(() => {
    localStorage.setItem('density-is-spot', JSON.stringify(isSpot));
  }, [isSpot]);

  React.useEffect(() => {
    localStorage.setItem('density-coin-intervals', JSON.stringify(coinIntervals));
  }, [coinIntervals]);

  React.useEffect(() => {
    localStorage.setItem('density-show-volume', JSON.stringify(showVolume));
  }, [showVolume]);

  React.useEffect(() => {
    localStorage.setItem('density-presets', JSON.stringify(savedPresets));
  }, [savedPresets]);

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

  // Отладочная информация
  console.log('Density Page Debug:', {
    isCompactView,
    loading,
    error,
    allCoinsLength: allCoins?.length || 0,
    densityCoinsLength: densityCoins?.length || 0,
    isSpot
  });

  return (
    <div className="container-fluid p-lg-4 p-0 density-page pb-5">
      {/* Заголовок и управление */}
      <div className="d-flex justify-content-between align-items-center mb-lg-4 mb-3 px-lg-4 px-2 px-sm-0">
        <div>
        </div>
        
        {/* Управление */}
        <div className="d-flex gap-2 flex-wrap">
          {/* Сохраненные пресеты */}
          {savedPresets.map((preset, index) => (
            <button
              key={index}
              type="button"
              className="btn btn-sm btn-outline-info"
              onClick={() => {
                // Применяем настройки пресета
                setIsCompactView(preset.settings.isCompactView);
                setIsSpot(preset.settings.isSpot);
                setShowVolume(preset.settings.showVolume);
                setExcludedCoins(preset.settings.excludedCoins);
              }}
              title={`Применить пресет: ${preset.name}`}
            >
              {preset.name}
            </button>
          ))}
          
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
            onClick={() => setShowSettingsModal(true)}
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
              <div className="card" style={{ border: '1px solid rgba(0, 0, 0, 0.1)', borderRadius: '0.75rem', boxShadow: 'none', outline: 'none', backgroundColor: '#ffffff', margin: '12px 0', overflow: 'hidden' }}>
                <div className="card-body p-0" style={{ border: 'none', boxShadow: 'none', outline: 'none', paddingLeft: '0', paddingRight: '0' }}>
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
                  <div style={{ border: 'none' }}>
                    <div style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem', paddingLeft: '0', paddingRight: '0', marginLeft: '0', marginRight: '0' }}>
                      


                      {/* Блок данных по DOM стенке */}
                      <div className="rounded p-3" style={{ fontSize: '1.3rem', backgroundColor: '#ffffff', border: 'none', borderRadius: '0', boxShadow: 'none', margin: '0' }}>
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
                            
                            {/* Горизонтальная таблица для мобильных - названия сверху, данные снизу */}
                            <div className="d-block d-md-none">
                              <table className="table table-borderless table-sm mb-0" style={{ fontSize: '1.0rem' }}>
                                <thead>
                                  <tr>
                                    <th style={{ padding: '4px', textAlign: 'left', verticalAlign: 'middle', border: '1px solid #dee2e6', width: '25%' }} className="text-muted fw-normal">Стенка</th>
                                    <th style={{ padding: '4px', textAlign: 'left', verticalAlign: 'middle', border: '1px solid #dee2e6', width: '25%' }} className="text-muted fw-normal">На цене</th>
                                    <th style={{ padding: '4px', textAlign: 'left', verticalAlign: 'middle', border: '1px solid #dee2e6', width: '25%' }} className="text-muted fw-normal">До цены</th>
                                    <th style={{ padding: '4px', textAlign: 'left', verticalAlign: 'middle', border: '1px solid #dee2e6', width: '25%' }} className="text-muted fw-normal">Съедание</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td style={{ padding: '4px', textAlign: 'left', verticalAlign: 'middle', border: '1px solid #dee2e6' }} className="text-dark fw-bold">300т</td>
                                    <td style={{ padding: '4px', textAlign: 'left', verticalAlign: 'middle', border: '1px solid #dee2e6' }} className="text-dark fw-bold">2000</td>
                                    <td style={{ padding: '4px', textAlign: 'left', verticalAlign: 'middle', border: '1px solid #dee2e6' }} className="text-danger fw-bold">+2.5%</td>
                                    <td style={{ padding: '4px', textAlign: 'left', verticalAlign: 'middle', border: '1px solid #dee2e6' }} className="fw-bold">~12 мин</td>
                                  </tr>
                                </tbody>
                              </table>
                              
                              {/* Вторая строка с оставшимися данными - 4 колонки для выравнивания */}
                              <table className="table table-borderless table-sm mb-0 mt-2" style={{ fontSize: '1.0rem' }}>
                                <thead>
                                  <tr>
                                    <th style={{ padding: '4px', textAlign: 'left', verticalAlign: 'middle', border: '1px solid #dee2e6', width: '25%' }} className="text-muted fw-normal">Время до</th>
                                    <th style={{ padding: '4px', textAlign: 'left', verticalAlign: 'middle', border: '1px solid #dee2e6', width: '25%' }} className="text-muted fw-normal">Жизнь</th>
                                    <th style={{ padding: '4px', textAlign: 'left', verticalAlign: 'middle', border: '1px solid #dee2e6', width: '25%' }} className="text-muted fw-normal">Активность</th>
                                    <th style={{ padding: '4px', textAlign: 'left', verticalAlign: 'middle', border: '1px solid #dee2e6', width: '25%' }} className="text-muted fw-normal"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td style={{ padding: '4px', textAlign: 'left', verticalAlign: 'middle', border: '1px solid #dee2e6' }} className="fw-bold">~45 мин</td>
                                    <td style={{ padding: '4px', textAlign: 'left', verticalAlign: 'middle', border: '1px solid #dee2e6' }} className="fw-bold">2.5ч</td>
                                    <td style={{ padding: '4px', textAlign: 'left', verticalAlign: 'middle', border: '1px solid #dee2e6' }} className="fw-bold">Высокая</td>
                                    <td style={{ padding: '4px', textAlign: 'left', verticalAlign: 'middle', border: '1px solid #dee2e6' }} className="fw-bold"></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                          
                          <div className="col-lg-12 col-12 mb-2">
                            <div className="progress mb-2 mt-2" style={{ height: '20px', position: 'relative' }}>
                              <div 
                                className="progress-bar bg-danger" 
                                role="progressbar" 
                                style={{ width: '25%' }}
                              >
                                <span className="text-white fw-bold">25%</span>
                              </div>
                              <span className="text-muted fw-bold position-absolute" style={{ right: '8px', top: '50%', transform: 'translateY(-50%)' }}>Vol: 2.4M</span>
                            </div>
                            
                            <div className="progress mb-3 mt-2" style={{ height: '20px', position: 'relative' }}>
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
                                      <div className="position-fixed card shadow-lg border-dark border-2" style={{ 
                                        top: '50%', 
                                        left: '50%', 
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: 99999,
                                        minWidth: '280px',
                                        maxWidth: '90vw'
                                      }}>
                                        <div className="card-body p-3">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                          <h6 className="mb-0 text-dark">
                                            <i className="bi bi-palette me-2"></i>
                                            Выберите цвет
                                          </h6>
                                          <button 
                                            type="button" 
                                            className="btn-close" 
                                            onClick={() => setColorPopup({ show: false, coinId: null })}
                                            aria-label="Закрыть"
                                          ></button>
                                        </div>
                                        <div className="d-flex justify-content-between flex-wrap gap-2 mb-3">
                                          {watchColors.map((color, idx) => (
                                            <button
                                              key={idx}
                                              type="button"
                                              className="btn btn-outline-dark border-2 rounded-circle p-0 shadow-sm"
                                              title={color.name}
                                              style={{ 
                                                width: '40px', 
                                                height: '40px', 
                                                backgroundColor: color.value,
                                                borderColor: '#333',
                                                transition: 'all 0.2s ease-in-out'
                                              }}
                                              onClick={() => setWatchColor(coin.id, color)}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.classList.add('shadow');
                                                e.currentTarget.style.transform = 'scale(1.1)';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.classList.remove('shadow');
                                                e.currentTarget.style.transform = 'scale(1)';
                                              }}
                                            ></button>
                                          ))}
                                        </div>
                                        {watchedCoins[coin.id] && (
                                          <div className="mt-3 border-top pt-3">
                                            <button 
                                              className="btn btn-sm btn-outline-danger w-100"
                                              onClick={() => removeWatch(coin.id)}
                                            >
                                              <i className="bi bi-trash me-1"></i>
                                              Убрать метку
                                            </button>
                                          </div>
                                        )}
                                        </div>
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

      {/* Модальное окно настроек */}
      {showSettingsModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowX: 'hidden' }}>
          <div className="modal-dialog modal-dialog-scrollable" style={{ maxWidth: '95vw', width: '95vw', margin: '1rem auto', overflowX: 'hidden' }}>
            <div className="modal-content" style={{ overflowX: 'hidden', maxWidth: '100%' }}>
              <div className="modal-header">
                <h5 className="modal-title">Настройки анализа плотности</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowSettingsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <div className="d-flex flex-column flex-md-row gap-2">
                          <input 
                            type="text" 
                            className="form-control flex-grow-1" 
                            placeholder="Введите имя настройки..."
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                          />
                          <button 
                            className="btn btn-outline-success flex-shrink-0 w-100 w-md-auto" 
                            type="button"
                            onClick={savePreset}
                            style={{ maxWidth: '200px' }}
                          >
                            Применить
                          </button>
                        </div>
                      </div>

                      {/* Сохраненные пресеты */}
                      {savedPresets.length > 0 && (
                        <div className="mb-3">
                          <label className="form-label">Сохраненные настройки</label>
                          <div className="d-flex flex-wrap gap-2">
                            {savedPresets.map((preset, index) => (
                              <button
                                key={index}
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => confirmDeletePreset(preset)}
                                title={`Удалить настройки: ${preset.name}`}
                              >
                                {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <h6>Параметры анализа</h6>
                      <div className="mb-3">
                        <label className="form-label">Капитализация монеты (млн USD)</label>
                        <div className="row">
                          <div className="col-6">
                            <label className="form-label small">От</label>
                            <input type="number" className="form-control" defaultValue="1" min="0" step="0.1" />
                          </div>
                          <div className="col-6">
                            <label className="form-label small">До</label>
                            <input type="number" className="form-control" defaultValue="10" min="0" step="0.1" />
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Минимальный объем (стенки)</label>
                        <input type="number" className="form-control" defaultValue="1000" min="1000" step="1000" placeholder="от 1 тыс" />
                      </div>
                      
                      {/* Тип рынка */}
                      <div className="mb-3">
                        <label className="form-label">Тип рынка</label>
                        <div>
                          <button
                            type="button"
                            className={`btn ${isSpot ? 'btn-success' : 'btn-outline-success'} me-2`}
                            onClick={() => setIsSpot(true)}
                          >
                            Спот
                          </button>
                          <button
                            type="button"
                            className={`btn ${!isSpot ? 'btn-warning' : 'btn-outline-warning'}`}
                            onClick={() => setIsSpot(false)}
                          >
                            Фьючерсы
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h6>Отображение</h6>
                      <div className="form-check mb-3">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="showVolume"
                          checked={showVolume} 
                          onChange={(e) => setShowVolume(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="showVolume">
                          Показывать объемы на графиках
                        </label>
                      </div>
                      <div className="form-check mb-3">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="compactView"
                          checked={isCompactView} 
                          onChange={(e) => setIsCompactView(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="compactView">
                          Компактный вид (2 графика в ряд)
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-12">
                      <h6>Дополнительные настройки</h6>
                      <div className="row">
                        <div className="col-sm-6">
                          <div className="mb-3">
                            <label className="form-label">Сигнал подход до цели за (%)</label>
                            <input type="number" className="form-control" defaultValue="5" min="1" max="50" step="0.1" />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Исключение монет</label>
                            <div className="d-flex flex-column flex-md-row gap-2">
                              <input 
                                type="text" 
                                className="form-control flex-grow-1" 
                                placeholder="Начните вводить название монeты..."
                                list="coinsList"
                                value={coinToExclude}
                                onChange={(e) => setCoinToExclude(e.target.value)}
                              />
                              <button 
                                className="btn btn-outline-primary flex-shrink-0 w-100 w-md-auto" 
                                type="button"
                                onClick={addExcludedCoin}
                                style={{ maxWidth: '200px' }}
                              >
                                Применить
                              </button>
                            </div>
                            <datalist id="coinsList">
                              <option value="BTC">Bitcoin</option>
                              <option value="ETH">Ethereum</option>
                              <option value="BNB">Binance Coin</option>
                              <option value="ADA">Cardano</option>
                              <option value="SOL">Solana</option>
                              <option value="DOT">Polkadot</option>
                              <option value="MATIC">Polygon</option>
                              <option value="AVAX">Avalanche</option>
                            </datalist>
                            
                            {/* Бейджи с исключенными монетами */}
                            {excludedCoins.length > 0 && (
                              <div className="mt-2">
                                {excludedCoins.map((coin, index) => (
                                  <span key={index} className="badge bg-danger me-2 mb-1">
                                    {coin}
                                    <button 
                                      type="button" 
                                      className="btn-close btn-close-white ms-2" 
                                      style={{ fontSize: '0.6em' }}
                                      onClick={() => removeExcludedCoin(coin)}
                                      aria-label="Удалить"
                                    ></button>
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            <small className="form-text text-muted">Введите символ монеты для исключения из анализа</small>
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="mb-3">
                            <label className="form-label">Сигнал примерное время до</label>
                            <input type="number" className="form-control" defaultValue="30" min="5" max="300" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowSettingsModal(false)}
                >
                  Отмена
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    // Сохраняем настройки и показываем попап
                    console.log('Настройки сохранены');
                    setShowSettingsModal(false);
                    setShowSavePopup(true);
                    // Автоматически скрываем попап через 3 секунды
                    setTimeout(() => setShowSavePopup(false), 3000);
                  }}
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Попап подтверждения сохранения */}
      {showSavePopup && (
        <div className="position-fixed top-50 start-50 translate-middle" style={{ zIndex: 9999 }}>
          <div className="alert alert-success alert-dismissible fade show shadow-lg" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            <strong>Настройки сохранены!</strong> Изменения применены успешно.
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowSavePopup(false)}
              aria-label="Close"
            ></button>
          </div>
        </div>
      )}

      {/* Диалог подтверждения удаления пресета */}
      {showDeleteConfirm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Удалить пресет</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPresetToDelete(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <p>Вы уверены, что хотите удалить пресет <strong>"{presetToDelete?.name}"</strong>?</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPresetToDelete(null);
                  }}
                >
                  Нет
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={deletePreset}
                >
                  Да
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}