import React, { useEffect, useRef } from 'react';
import { init, dispose } from 'klinecharts';
import { useBinanceKlines } from '../hooks/useBinanceQuery';

const KLineChart = ({ symbol, interval = '1m', spot = true, compact = false, showMidLine = false, onIntervalChange, fullHeight = false, limit = 500 }) => {
  const chartRef = useRef(null);
  const chart = useRef(null);
  const midLineId = useRef(null); // Храним ID средней линии

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

  // Используем TanStack Query для загрузки данных свечей
  const { data: klinesData, isLoading, error, refetch } = useBinanceKlines(
    symbol || 'BTCUSDT', 
    interval, 
    spot, 
    compact ? (limit || 100) : 1000
  );

  // Функция для прокрутки к последнему бару
  const scrollToLastBar = () => {
    if (chart.current && klinesData && klinesData.length > 0) {
      try {
        // Прокручиваем к последнему бару
        chart.current.scrollToRealTime();
        console.log('📍 Прокрутка к последнему бару');
      } catch (error) {
        console.log('Ошибка прокрутки, пробуем альтернативный метод');
        try {
          // Альтернативный метод - прокрутка к концу
          chart.current.scrollToDataIndex(klinesData.length - 1);
        } catch (e) {
          console.log('Не удалось прокрутить к последнему бару');
        }
      }
    }
  };

  // Функция для принудительного обновления данных и прокрутки
  const handleRefresh = async () => {
    try {
      // Обновляем данные
      await refetch();
      // После обновления прокручиваем к последнему бару
      setTimeout(() => {
        scrollToLastBar();
      }, 100);
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  };

  // Функция для добавления горизонтальной линии посередине
  const addMidLine = (data) => {
    if (!chart.current || !data || data.length === 0) return;
    
    try {
      // Сначала удаляем предыдущую линию, если она есть
      if (midLineId.current) {
        try {
          chart.current.removeShape(midLineId.current);
        } catch (e) {
          console.log('Предыдущая линия уже удалена');
        }
      }
      
      // Находим максимальную и минимальную цены
      const prices = data.map(item => [item.high, item.low]).flat();
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);
      const midPrice = (maxPrice + minPrice) / 2;
      
      // Добавляем горизонтальную линию и сохраняем ID
      midLineId.current = chart.current.createShape({
        name: 'horizontalRayLine',
        lock: true,
        styles: {
          line: {
            style: 'dashed',
            dashedValue: [6, 6],
            color: '#ff6b6b',
            size: 2
          }
        },
        dataSource: [{
          type: 'price',
          value: midPrice
        }]
      });
      
      console.log(`📐 Добавлена средняя линия на уровне $${midPrice.toFixed(2)}`);
    } catch (error) {
      console.error('Ошибка добавления линии:', error);
    }
  };

  // Инициализация графика
  useEffect(() => {
    if (chartRef.current && !chart.current) {
      // Определяем, мобильное ли устройство
      const isMobile = window.innerWidth <= 768;
      
      // Настройки графика с полностью отключенной сеткой
      const chartOptions = {
        grid: {
          show: false,
          horizontal: {
            show: false
          },
          vertical: {
            show: false
          }
        },
        candle: {
          margin: {
            top: 0.1,
            bottom: 0.05
          },
          type: 'candle_solid',
          bar: {
            upColor: '#26a69a',
            downColor: '#ef5350',
            noChangeColor: '#888888'
          },
          tooltip: {
            showRule: 'follow_cross',
            showType: 'standard',
            labels: ['时间', '开', '收', '高', '低', '成交量'],
            values: null,
            defaultValue: 'n/a',
            rect: {
              position: 'fixed',
              paddingLeft: 0,
              paddingRight: 0,
              paddingTop: 0,
              paddingBottom: 6,
              offsetLeft: 8,
              offsetTop: 8,
              offsetRight: 8,
              offsetBottom: 8,
              borderRadius: 4,
              borderSize: 1,
              borderColor: '#3f4254',
              color: '#D9D9D9'
            },
            text: {
              size: 12,
              family: 'Helvetica Neue',
              weight: 'normal',
              color: '#D9D9D9',
              marginLeft: 8,
              marginTop: 6,
              marginRight: 8,
              marginBottom: 0
            }
          }
        },
        technicalIndicator: {
          margin: {
            top: 0.1,
            bottom: 0.05
          },
          bar: {
            upColor: '#26a69a',
            downColor: '#ef5350',
            noChangeColor: '#888888'
          },
          line: {
            size: 1,
            colors: ['#FF9600', '#9D65C9', '#2196F3', '#E11D74', '#01C5C4']
          },
          circle: {
            upColor: '#26a69a',
            downColor: '#ef5350',
            noChangeColor: '#888888'
          }
        },
        xAxis: {
          show: true,
          height: null,
          axisLine: {
            show: true,
            color: '#888888',
            size: 1
          },
          tickText: {
            show: true,
            color: '#D9D9D9',
            family: 'Helvetica Neue',
            weight: 'normal',
            size: isMobile ? 9 : 11, // Еще меньше текст для больших баров
            paddingTop: 2,
            paddingBottom: 4
          },
          tickLine: {
            show: false, // Отключаем линии на оси X
            size: 1,
            length: 3,
            color: '#888888'
          }
        },
        yAxis: {
          show: true,
          width: isMobile ? 50 : 60, // Уменьшаем ширину оси Y на мобильных
          position: 'right',
          type: 'normal',
          inside: false,
          reverse: false,
          axisLine: {
            show: true,
            color: '#888888',
            size: 1
          },
          tickText: {
            show: true,
            color: '#D9D9D9',
            family: 'Helvetica Neue',
            weight: 'normal',
            size: isMobile ? 9 : 11, // Еще меньше текст для больших баров
            paddingLeft: 2,
            paddingRight: 4
          },
          tickLine: {
            show: false, // Отключаем линии на оси Y
            size: 1,
            length: 3,
            color: '#888888'
          }
        },
        crosshair: {
          show: false, // Полностью отключаем перекрестие
          horizontal: {
            show: false,
            line: { show: false }
          },
          vertical: {
            show: false,
            line: { show: false }
          }
        }
      };
      
      chart.current = init(chartRef.current, chartOptions);
      
      // Принудительно отключаем сетку после инициализации
      if (chart.current && chart.current.setStyles) {
        chart.current.setStyles({
          grid: {
            show: false,
            horizontal: { show: false },
            vertical: { show: false }
          },
          crosshair: {
            show: false,
            horizontal: { show: false, line: { show: false } },
            vertical: { show: false, line: { show: false } }
          }
        });
      }
      
      // Устанавливаем количество видимых баров в зависимости от размера экрана
      if (chart.current) {
        const visibleRange = isMobile ? 
          { from: 0.6, to: 1.0 } : // На мобильных показываем 40% данных (больше баров)
          { from: 0.5, to: 1.0 };  // На десктопе показываем 50% данных (больше баров)
        
        setTimeout(() => {
          try {
            if (chart.current && typeof chart.current.setVisibleRange === 'function') {
              // Дополнительная проверка готовности графика
              const canvasElement = chartRef.current?.querySelector('canvas');
              if (canvasElement && canvasElement.width > 0) {
                chart.current.setVisibleRange(visibleRange);
                console.log('✅ Видимый диапазон установлен:', visibleRange);
              } else {
                console.log('⏳ График ещё не готов, пропускаем установку диапазона');
              }
            } else {
              console.log('⚠️ Метод setVisibleRange недоступен');
            }
          } catch (e) {
            console.log('⚠️ Ошибка установки видимого диапазона:', e.message);
          }
        }, 500); // Увеличиваем задержку для онлайн версии
      }
      
      console.log(`📊 График инициализирован для ${isMobile ? 'мобильного' : 'десктопного'} устройства`);
      
      // Для компактного режима принудительно обновляем размер
      if (compact) {
        setTimeout(() => {
          if (chart.current) {
            chart.current.resize();
            console.log('📐 Размер графика обновлен для компактного режима');
          }
        }, 100);
        
        // ResizeObserver для отслеживания изменений размера контейнера
        const resizeObserver = new ResizeObserver(() => {
          if (chart.current) {
            chart.current.resize();
          }
        });
        
        if (chartRef.current) {
          resizeObserver.observe(chartRef.current);
        }
        
        return () => {
          resizeObserver.disconnect();
        };
      }
      
      // Обработчик изменения размера окна для адаптации графика
      const handleResize = () => {
        if (chart.current) {
          const isMobile = window.innerWidth <= 768;
          const visibleRange = isMobile ? 
            { from: 0.6, to: 1.0 } : // На мобильных показываем больше баров (40% данных)
            { from: 0.5, to: 1.0 };  // На десктопе больше баров (50% данных)
          
          setTimeout(() => {
            try {
              if (chart.current && typeof chart.current.resize === 'function') {
                chart.current.resize();
              }
              
              if (chart.current && typeof chart.current.setVisibleRange === 'function') {
                const canvasElement = chartRef.current?.querySelector('canvas');
                if (canvasElement && canvasElement.width > 0) {
                  chart.current.setVisibleRange(visibleRange);
                }
              }
              
              // Принудительно обновляем размеры для мобильных
              if (isMobile && chartRef.current) {
                const rect = chartRef.current.getBoundingClientRect();
                if (rect.height < 300) {
                  chartRef.current.style.height = '350px';
                  if (chart.current && typeof chart.current.resize === 'function') {
                    chart.current.resize();
                  }
                }
              }
              
              console.log(`📱 График адаптирован для ${isMobile ? 'мобильного' : 'десктопного'} экрана`);
            } catch (e) {
              console.log('⚠️ Ошибка адаптации графика:', e.message);
            }
          }, 100);
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }

    return () => {
      if (chart.current) {
        dispose(chartRef.current);
        chart.current = null;
        console.log('🗑️ График уничтожен');
      }
    };
  }, [compact]);

  // Обновление данных графика при получении новых данных из TanStack Query
  useEffect(() => {
    if (chart.current && klinesData && klinesData.length > 0) {
      chart.current.applyNewData(klinesData);
      console.log(`✅ Загружено ${klinesData.length} свечей через TanStack Query`);
      
      // Прокручиваем к последнему бару после загрузки данных
      setTimeout(() => {
        scrollToLastBar();
      }, 50);
      
      // Добавляем среднюю линию, если включена
      if (showMidLine) {
        addMidLine(klinesData);
      }
    }
  }, [klinesData]);

  // Эффект для обновления линии при изменении showMidLine
  useEffect(() => {
    if (chart.current && klinesData) {
      if (showMidLine) {
        // Добавляем среднюю линию
        addMidLine(klinesData);
      } else {
        // Убираем среднюю линию по ID
        if (midLineId.current) {
          try {
            chart.current.removeShape(midLineId.current);
            midLineId.current = null;
            console.log('🗑️ Средняя линия удалена');
          } catch (error) {
            console.log('Ошибка удаления линии:', error);
            // Пытаемся удалить все фигуры как fallback
            try {
              chart.current.removeAllShapes();
              console.log('🗑️ Все фигуры удалены');
            } catch (e) {
              console.log('Не удалось удалить фигуры');
            }
          }
        }
      }
    }
  }, [showMidLine]);

  if (compact) {
    // Компактный режим для скринера
    return (
      <div style={{ 
        height: '100%', 
        width: '100%',
        padding: '5px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {isLoading && (
          <div className="d-flex align-items-center justify-content-center h-100">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Загрузка...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="d-flex align-items-center justify-content-center h-100 text-danger">
            <small>Ошибка загрузки</small>
          </div>
        )}
        <div 
          ref={chartRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        />
      </div>
    );
  }

  // Полный режим для страницы графиков
  if (fullHeight) {
    return (
      <div className="d-flex flex-column h-100">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-shrink-0">
          <div>
            <h4 className="mb-1">{symbol || 'BTCUSDT'}</h4>
            <small className="text-muted">
              {interval}
              {isLoading && ' • Загрузка...'}
              {error && ' • Ошибка загрузки'}
            </small>
          </div>
          <div>
            {error && (
              <small className="text-danger me-2">
                Используются тестовые данные
              </small>
            )}
          </div>
        </div>

        {/* Меню таймфреймов и кнопка обновления */}
        {onIntervalChange && (
          <div className="mb-3 flex-shrink-0">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div className="btn-group btn-group-sm d-flex flex-wrap" role="group" aria-label="Таймфреймы">
                {timeframes.map((tf) => (
                  <button
                    key={tf.value}
                    type="button"
                    className={`btn btn-sm ${interval === tf.value ? 'btn-primary' : 'btn-outline-primary'}`}
                    style={{ 
                      minWidth: '40px',
                      fontSize: window.innerWidth <= 768 ? '11px' : '12px',
                      padding: window.innerWidth <= 768 ? '4px 6px' : '6px 8px'
                    }}
                    onClick={() => onIntervalChange(tf.value)}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
              
              {/* Кнопка обновления */}
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={handleRefresh}
                disabled={isLoading}
                title="Обновить данные и перейти к последнему бару"
                style={{ 
                  minWidth: '36px',
                  fontSize: window.innerWidth <= 768 ? '14px' : '16px'
                }}
              >
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  '🔄'
                )}
              </button>
            </div>
          </div>
        )}
        
        <div 
          ref={chartRef} 
          className="flex-grow-1"
          style={{ 
            width: '100%', 
            minHeight: window.innerWidth <= 768 ? '350px' : 0,
            height: window.innerWidth <= 768 ? 'auto' : '100%',
            backgroundColor: '#fff',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            display: 'block',
            overflow: 'hidden'
          }}
        />
        
        <div className="mt-2 flex-shrink-0">
          <small className="text-muted">
            📊 Интерактивный график • Используйте колесо мыши для масштабирования
          </small>
        </div>
      </div>
    );
  }

  // Обычный режим для страницы графиков  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="mb-1">{symbol || 'BTCUSDT'}</h4>
          <small className="text-muted">
            {interval}
            {isLoading && ' • Загрузка...'}
            {error && ' • Ошибка загрузки'}
          </small>
        </div>
        <div>
          {error && (
            <small className="text-danger me-2">
              Используются тестовые данные
            </small>
          )}
        </div>
      </div>

      {/* Меню таймфреймов и кнопка обновления */}
      {onIntervalChange && (
        <div className="mb-3">
          <div className="d-flex align-items-center gap-3">
            <div className="btn-group btn-group-sm" role="group" aria-label="Таймфреймы">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  type="button"
                  className={`btn ${interval === tf.value ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => onIntervalChange(tf.value)}
                >
                  {tf.label}
                </button>
              ))}
            </div>
            
            {/* Кнопка обновления */}
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Обновить данные и перейти к последнему бару"
            >
              {isLoading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                '🔄'
              )}
            </button>
          </div>
        </div>
      )}
      
      <div 
        ref={chartRef} 
        style={{ 
          width: '100%', 
          height: '500px',
          backgroundColor: '#fff',
          border: '1px solid #dee2e6',
          borderRadius: '8px'
        }}
      />
      
      <div className="mt-2">
        <small className="text-muted">
          📊 Интерактивный график • Используйте колесо мыши для масштабирования
        </small>
      </div>
    </div>
  );
};

export default KLineChart;