import React, { useEffect, useRef, useState } from 'react';
import { init, dispose } from 'klinecharts';
import { useBinanceKlines } from '../hooks/useBinanceQuery';
import { BreakoutIndicator, BreakoutDisplay } from './BreakoutIndicator';

const KLineChart = ({ symbol, interval = '1m', spot = true, compact = false, showMidLine = false, onIntervalChange, fullHeight = false, limit = 500, showVolume = false, showVolume2 = false }) => {
  const chartRef = useRef(null);
  const chart = useRef(null);
  const midLineId = useRef(null); // Храним ID средней линии
  const volumeIndicatorId = useRef(null); // Храним ID индикатора объема
  
  // Состояние для анализа пробоя
  const [breakoutAnalysis, setBreakoutAnalysis] = useState(null);
  const [showBreakoutResult, setShowBreakoutResult] = useState(false);
  const [indicatorsVisible, setIndicatorsVisible] = useState(false);

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

  // Функции для управления масштабом цены на мобильных
  const handlePriceZoomIn = () => {
    if (chart.current) {
      try {
        // Сброс к авто-масштабу - сжимает цену
        chart.current.adjustVisibleRange();
        console.log('🔍 Сжатие масштаба цены (авто-подгонка)');
      } catch (error) {
        console.warn('Не удалось сжать масштаб цены:', error);
      }
    }
  };

  const handlePriceZoomOut = () => {
    if (chart.current) {
      try {
        // Принудительная прокрутка к концу данных для "разжатия" вида
        chart.current.scrollToRealTime();
        setTimeout(() => {
          chart.current.adjustVisibleRange();
        }, 100);
        console.log('🔍 Разжатие масштаба цены');
      } catch (error) {
        console.warn('Не удалось разжать масштаб цены:', error);
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

  // Функции управления масштабом и сжатием
  const zoomOut = () => {
    if (chart.current && chart.current.zoomAtCoordinate) {
      chart.current.zoomAtCoordinate(0.9); // Отдаляем
    }
  };

  const zoomIn = () => {
    if (chart.current && chart.current.zoomAtCoordinate) {
      chart.current.zoomAtCoordinate(1.1); // Приближаем
    }
  };

  const moreBars = () => {
    if (chart.current && chart.current.getBarSpace && chart.current.setBarSpace) {
      const currentSpace = chart.current.getBarSpace();
      const newSpace = Math.max(1, currentSpace - 1);
      chart.current.setBarSpace(newSpace);
    }
  };

  const fewerBars = () => {
    if (chart.current && chart.current.getBarSpace && chart.current.setBarSpace) {
      const currentSpace = chart.current.getBarSpace();
      const newSpace = Math.min(20, currentSpace + 1);
      chart.current.setBarSpace(newSpace);
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
      
      // Настройки графика с полностью отключенной сеткой и рамками
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
            showRule: 'none', // Отключаем tooltip с данными OHLCV
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
              borderRadius: 0,
              borderSize: 0,
              borderColor: 'transparent',
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
      
      // Оптимизация отображения - больше свечей и сжатие
      if (chart.current) {
        // 1. Сжимаем бары для отображения большего количества свечей
        chart.current.setBarSpace(4); // Меньше значение = больше свечей на экране
        
        // 2. Делаем нормальный отступ справа от последней свечи до оси цены
        chart.current.setOffsetRightDistance(30); // Увеличиваем отступ для красоты
        chart.current.setMaxOffsetRightDistance(120); // Верхний предел
        
        // 3. Включаем зум для мобильных устройств
        chart.current.setZoomEnabled(true); // Горизонтальный зум (сжимать/разжимать время)
        
        // 4. Гарантируем минимум видимых свечей
        if (chart.current.setRightMinVisibleBarCount) {
          chart.current.setRightMinVisibleBarCount(120);
        }
        
        // 5. Слегка отдаляем для большего обзора
        if (chart.current.zoomAtCoordinate) {
          chart.current.zoomAtCoordinate(0.85); // Отдаляем для большего количества свечей
        }
        
        // 6. Настраиваем ось цены для экономии места
        chart.current.setStyles({
          yAxis: {
            width: 54, // Чуть уже ось цены
            tickText: { 
              margin: 2, 
              size: 10 
            }
          }
        });
      }
      
      // Принудительно отключаем сетку, рамки и tooltip после инициализации
      if (chart.current && chart.current.setStyles) {
        chart.current.setStyles({
          // Отключаем рамки самого графика
          separator: {
            size: 0,
            color: 'transparent',
            fill: false,
            activeBackgroundColor: 'transparent'
          },
          grid: {
            show: false,
            horizontal: { show: false },
            vertical: { show: false }
          },
          crosshair: {
            show: false,
            horizontal: { show: false, line: { show: false } },
            vertical: { show: false, line: { show: false } },
            // Компактные метки crosshair
            yAxis: {
              label: { 
                size: 10, 
                paddingLeft: 4, 
                paddingRight: 4, 
                borderRadius: 2 
              }
            }
          },
          candle: { 
            tooltip: { showRule: 'none' },
            border: { show: false } // Убираем рамки свечей
          },
          indicator: { 
            tooltip: { showRule: 'none' }
          },
          // Убираем все возможные рамки и границы
          xAxis: {
            show: true,
            axisLine: { show: false }, // Убираем линию оси X
            tickLine: { show: false }, // Убираем засечки оси X
            splitLine: { show: false } // Убираем разделители оси X
          },
          // Компактная ось Y
          yAxis: {
            show: true,
            width: 38, // Уменьшаем ширину оси с ~52-60 до 38
            inside: false, // Ось снаружи графика
            axisLine: { show: false }, // Убираем линию оси Y
            tickLine: { show: false }, // Убираем засечки оси Y
            splitLine: { show: false }, // Убираем разделители оси Y
            tickText: {
              size: 10, // Меньший размер шрифта
              marginStart: 0,
              marginEnd: 0,
              // Компактный форматтер цен - каждую вторую скрываем и сокращаем числа
              formatter: (value, index) => {
                if (index % 2) return ''; // Каждую вторую подпись скрываем
                // Сокращаем большие числа
                if (value >= 1e6) return (value/1e6).toFixed(2) + 'M';
                if (value >= 1e3) return (value/1e3).toFixed(1) + 'K';
                return value.toFixed(2);
              }
            }
          },
          // Компактная метка последней цены
          priceMark: {
            last: {
              show: true,
              label: { 
                size: 10, 
                paddingLeft: 4, 
                paddingRight: 4, 
                borderRadius: 2 
              },
              line: { show: true }
            }
          },
          // Убираем отступы layout
          layout: {
            padding: { 
              top: 0, 
              right: 0, 
              bottom: 0, 
              left: 0 
            }
          }
        });
      }
      
      // Устанавливаем количество видимых баров в зависимости от размера экрана
      if (chart.current) {
        const visibleRange = isMobile ? 
          { from: 0.35, to: 1.0 } : // На мобильных показываем 65% данных 
          { from: 0.65, to: 1.0 };   // На десктопе показываем 35% данных (еще меньше баров, еще крупнее)
        
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
            { from: 0.35, to: 1.0 } : // На мобильных 65% данных (+30% баров)
            { from: 0.22, to: 1.0 };  // На десктопе 78% данных (+30% баров)
          
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
        // Добавляем больший отступ слева через прокрутку назад
        setTimeout(() => {
          if (chart.current && chart.current.scrollByDistance) {
            chart.current.scrollByDistance(-35); // Увеличиваем отступ до 35px назад
          }
        }, 100);
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

  // Эффект для управления индикатором объема
  useEffect(() => {
    if (chart.current) {
      if (showVolume) {
        // Сначала очищаем ВСЕ индикаторы и элементы
        try {
          // Убираем все индикаторы через правильный API v9.8.9
          chart.current.removeIndicator();
          
          // Очищаем все фигуры и линии
          if (chart.current.removeAllShapes) {
            chart.current.removeAllShapes();
          }
          
          // Очищаем все оверлеи
          if (chart.current.removeOverlay) {
            chart.current.removeOverlay();
          }
          
          // Очищаем индикаторы пробоя если есть
          if (BreakoutIndicator && BreakoutIndicator.clearAllIndicators) {
            BreakoutIndicator.clearAllIndicators(chart.current);
          }
          
          // Сбрасываем состояние других кнопок
          setIndicatorsVisible(false);
          
          console.log('🧹 Все индикаторы очищены перед добавлением объема');
        } catch (error) {
          console.log('Ошибка очистки индикаторов:', error);
        }
        
        // Теперь добавляем ТОЛЬКО индикатор объема БЕЗ линий MA
        try {
          // Сначала переопределяем индикатор VOL чтобы убрать MA линии
          if (chart.current.overrideTechnicalIndicator) {
            chart.current.overrideTechnicalIndicator({
              name: 'VOL',
              shortName: 'VOL',
              calcParams: [], // Пустые параметры = нет скользящих средних
              figures: [
                {
                  key: 'volume',
                  title: 'VOL',
                  type: 'bar',
                  baseValue: 0,
                  styles: (data, indicator, defaultStyles) => {
                    const kLineData = data.kLineData;
                    if (kLineData) {
                      return {
                        color: kLineData.close > kLineData.open ? '#26a69a' : '#ef5350'
                      };
                    }
                    return { color: '#888888' };
                  }
                }
              ]
            });
            console.log('🔧 Индикатор VOL переопределен без MA линий');
          }
          
          // Теперь создаем индикатор с параметрами без MA
          let createdVolumeId;
          
          // Пробуем создать с пустыми параметрами для MA
          if (chart.current.createIndicator) {
            createdVolumeId = chart.current.createIndicator('VOL', true, { 
              id: 'volume_pane',
              height: compact ? 60 : 80,
              calcParams: [], // Отключаем MA параметры
              styles: {
                ma: [] // Убираем стили для MA линий
              }
            });
          } else if (chart.current.createTechnicalIndicator) {
            createdVolumeId = chart.current.createTechnicalIndicator('VOL', true, { 
              id: 'volume_pane',
              height: compact ? 60 : 80,
              calcParams: [], // Отключаем MA параметры
              styles: {
                ma: [] // Убираем стили для MA линий
              }
            });
          }
          
          // Сохраняем ID для последующего удаления
          volumeIndicatorId.current = createdVolumeId;
          
          console.log('📈 Чистый индикатор объема без MA линий включен:', createdVolumeId);
        } catch (error) {
          console.error('❌ Ошибка создания индикатора объема:', error);
          console.log('Доступные методы графика:', Object.getOwnPropertyNames(chart.current));
        }
      } else {
        // Убираем ТОЛЬКО индикатор объема при втором клике
        try {
          // Пробуем удалить по сохраненному ID
          if (volumeIndicatorId.current && chart.current.removeIndicator) {
            chart.current.removeIndicator(volumeIndicatorId.current);
            volumeIndicatorId.current = null;
            console.log('🗑️ Индикатор объема удален по ID');
          } else {
            // Альтернативный способ - удаляем по строковому ID
            if (chart.current.removeIndicator) {
              chart.current.removeIndicator('volume_pane');
              console.log('🗑️ Индикатор объема удален по строковому ID');
            }
          }
          
          // Если не помогло - удаляем все индикаторы
          if (chart.current.removeIndicator) {
            chart.current.removeIndicator();
            console.log('🗑️ Все индикаторы удалены как fallback');
          }
          
        } catch (error) {
          console.log('Ошибка удаления индикатора объема:', error);
        }
      }
    }
  }, [showVolume, compact]);

  // Эффект для кнопки ПАМП - управляется в ScreenerPage, здесь ничего не делаем
  useEffect(() => {
    // Логика ПАМП-монет обрабатывается в ScreenerPage, здесь только принимаем параметр
    if (showVolume2) {
      console.log('� ПАМП режим активен для этого графика');
    }
  }, [showVolume2]);

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
            border: 'none',
            borderRadius: '0',
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
        <div className="d-flex justify-content-between align-items-center mb-3 flex-shrink-0 flex-wrap gap-2">
          <div className="d-flex flex-column">
            <h4 className="mb-1">{symbol || 'BTCUSDT'}</h4>
          </div>

          {/* Меню таймфреймов и кнопка обновления в одном ряду с названием */}
          {onIntervalChange && (
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
              
              {/* Кнопка Пробой с popover */}
              <div className="position-relative">
                <button
                  type="button"
                  className={`btn btn-sm ${indicatorsVisible ? 'btn-warning' : 'btn-outline-warning'}`}
                  title={indicatorsVisible ? "Убрать индикаторы пробоя" : "Показать анализ пробоя уровней"}
                  style={{ 
                    minWidth: '60px',
                    fontSize: window.innerWidth <= 768 ? '11px' : '12px',
                    padding: window.innerWidth <= 768 ? '4px 6px' : '6px 8px'
                  }}
                  onClick={() => {
                  console.log('🎯 Нажата кнопка Пробой, текущее состояние:', indicatorsVisible);
                  
                  if (klinesData && klinesData.length > 0 && chart.current) {
                    // Если индикаторы видны - убираем их
                    if (indicatorsVisible) {
                      console.log('🧹 Убираем индикаторы');
                      
                      const clearResult = BreakoutIndicator.clearAllIndicators(chart.current);
                      console.log('🗑️ Результат очистки:', clearResult);
                      
                      setIndicatorsVisible(false);
                      setShowBreakoutResult(false);
                      setBreakoutAnalysis(null);
                      
                      return;
                    }
                    
                    // Если индикаторы не видны - показываем их
                    console.log('✅ Показываем индикаторы. Данные и график доступны:', {
                      dataLength: klinesData.length,
                      chartExists: !!chart.current,
                      interval: interval
                    });
                    
                    // Рисуем линии поддержки и сопротивления с учетом таймфрейма
                    const linesResult = BreakoutIndicator.drawSupportResistanceLines(chart.current, klinesData, interval);
                    
                    console.log('📊 Результат рисования линий:', JSON.stringify(linesResult, null, 2));
                    
                    // Расчитываем Volume Profile для видимых свечей
                    const volumeProfileResult = BreakoutIndicator.calculateVolumeProfile(klinesData);
                    console.log('📈 Volume Profile результат:', volumeProfileResult);
                    
                    // Рисуем Volume Profile линии если расчет успешен
                    let vpLinesResult = null;
                    if (volumeProfileResult.success) {
                      vpLinesResult = BreakoutIndicator.drawVolumeProfileLines(
                        chart.current, 
                        volumeProfileResult.profile, 
                        klinesData
                      );
                      console.log('🎨 Volume Profile линии:', vpLinesResult);
                    }
                    
                    // Анализируем пробой
                    const analysis = BreakoutIndicator.analyzeBreakout(klinesData, {
                      lookbackPeriod: 20,
                      volumeThreshold: 1.5,
                      priceThreshold: 0.002
                    });
                    
                    // Добавляем информацию о линиях и Volume Profile к анализу
                    const enhancedAnalysis = {
                      ...analysis,
                      linesDrawn: linesResult.success,
                      linesMessage: linesResult.message,
                      volumeProfile: volumeProfileResult.success ? volumeProfileResult.profile : null,
                      volumeProfileMessage: volumeProfileResult.message,
                      vpLinesDrawn: vpLinesResult?.success || false
                    };
                    
                    setBreakoutAnalysis(enhancedAnalysis);
                    setShowBreakoutResult(true);
                    setIndicatorsVisible(true);
                  } else {
                    console.warn('❌ Недостаточно данных для анализа:', {
                      klinesData: !!klinesData,
                      dataLength: klinesData?.length || 0,
                      chart: !!chart.current
                    });
                  }
                }}
              >
                {indicatorsVisible ? 'Скрыть' : 'Пробой'}
              </button>
              
              {/* Popover результатов анализа */}
              {showBreakoutResult && breakoutAnalysis && (
                <BreakoutDisplay 
                  analysis={breakoutAnalysis}
                  onClose={() => setShowBreakoutResult(false)}
                />
              )}
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
              
              {/* Кнопки управления масштабом цены - только на мобильных */}
              {window.innerWidth <= 768 && (
                <div className="btn-group btn-group-sm" role="group" aria-label="Масштаб цены">
                  <button
                    type="button"
                    className="btn btn-outline-info btn-sm"
                    onClick={handlePriceZoomIn}
                    title="Сжать масштаб цены (автоподгонка)"
                    style={{ 
                      minWidth: '32px',
                      fontSize: '12px',
                      padding: '4px 6px'
                    }}
                  >
                    ⬇
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-info btn-sm"
                    onClick={handlePriceZoomOut}
                    title="Разжать масштаб цены"
                    style={{ 
                      minWidth: '32px',
                      fontSize: '12px',
                      padding: '4px 6px'
                    }}
                  >
                    ⬆
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div 
          ref={chartRef} 
          className="flex-grow-1"
          style={{ 
            width: '100%', 
            minHeight: window.innerWidth <= 768 ? '350px' : 0,
            height: window.innerWidth <= 768 ? 'auto' : '100%',
            backgroundColor: '#fff',
            border: 'none',
            borderRadius: '0',
            display: 'block',
            overflow: 'hidden'
          }}
        />
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
        className="chart-container"
        style={{ 
          width: '100%', 
          height: '500px',
          backgroundColor: '#fff',
          border: 'none',
          borderRadius: '0',
          margin: 0,
          padding: 0,
          boxShadow: 'none',
          outline: 'none'
        }}
      />
    </div>
  );
};

export default KLineChart;