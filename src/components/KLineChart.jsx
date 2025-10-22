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
    compact ? (limit || 100) : 500
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
      chart.current = init(chartRef.current);
      console.log('📊 График инициализирован');
      
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
          className="flex-grow-1"
          style={{ 
            width: '100%', 
            minHeight: 0,
            backgroundColor: '#fff',
            border: '1px solid #dee2e6',
            borderRadius: '8px'
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