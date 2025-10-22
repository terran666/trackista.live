import { useState, useEffect } from 'react';

/**
 * Расчет Volume Profile для анализа распределения объема по ценовым уровням
 * @param {Array} candles - массив свечей [{timestamp, open, high, low, close, volume}]
 * @param {Object} options - настройки расчета
 * @returns {Object} профиль объема с POC и Value Area
 */
function buildVolumeProfile(candles, {
  priceStep,
  session = null,
  bodyWeight = 0.7,
  valueAreaPct = 0.7,
} = {}) {
  if (!Array.isArray(candles) || !candles.length) return null;
  if (!priceStep || priceStep <= 0) throw new Error('priceStep must be > 0');

  // 1) Фильтрация по сессии (если нужно)
  let data = candles;
  const toTs = v => (v instanceof Date ? v.getTime() : Number(v));
  if (session && session.from != null && session.to != null) {
    const fromTs = toTs(session.from);
    const toTs_ = toTs(session.to);
    data = candles.filter(c => {
      const t = toTs(c.timestamp || c.time);
      return t >= fromTs && t <= toTs_;
    });
  }
  if (!data.length) return null;

  // 2) Определяем общий ценовой диапазон
  let minPrice = Infinity, maxPrice = -Infinity;
  for (const c of data) {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
  }
  
  // Нормализуем на шаг
  const floorTo = (x, step) => Math.floor(x / step) * step;
  const ceilTo  = (x, step) => Math.ceil (x / step) * step;
  minPrice = floorTo(minPrice, priceStep);
  maxPrice = ceilTo(maxPrice, priceStep);

  const binCount = Math.max(1, Math.round((maxPrice - minPrice) / priceStep));
  const bins = new Float64Array(binCount).fill(0);

  // 3) Распределяем объём свечи по корзинам
  for (const c of data) {
    const lo = Math.min(c.low, c.high);
    const hi = Math.max(c.low, c.high);
    if (hi === lo || c.volume <= 0) continue;

    const bodyLo = Math.min(c.open, c.close);
    const bodyHi = Math.max(c.open, c.close);

    // Безопасные границы тела (внутри тени)
    const bLo = Math.max(lo, Math.min(bodyLo, bodyHi));
    const bHi = Math.min(hi, Math.max(bodyLo, bodyHi));

    const bodyRange = Math.max(0, bHi - bLo);
    const tailRange = Math.max(0, (hi - lo) - bodyRange);

    const bodyVol = bodyRange > 0 ? c.volume * bodyWeight : 0;
    const tailVol = c.volume - bodyVol;

    // Хелпер распределения: равномерно по пересечению с корзиной
    const addRange = (rangeLo, rangeHi, vol) => {
      if (vol <= 0 || rangeHi <= rangeLo) return;
      const totalRange = rangeHi - rangeLo;
      const startIdx = Math.max(0, Math.floor((rangeLo - minPrice) / priceStep));
      const endIdx   = Math.min(binCount - 1, Math.floor((rangeHi - minPrice - 1e-12) / priceStep));
      for (let idx = startIdx; idx <= endIdx; idx++) {
        const binLo = minPrice + idx * priceStep;
        const binHi = binLo + priceStep;
        const overlap = Math.max(0, Math.min(rangeHi, binHi) - Math.max(rangeLo, binLo));
        if (overlap > 0) {
          const part = (overlap / totalRange) * vol;
          bins[idx] += part;
        }
      }
    };

    // Тени: нижняя и верхняя
    if (tailRange > 0) {
      if (bLo > lo) addRange(lo, bLo, tailVol * ((bLo - lo) / tailRange));
      if (hi > bHi) addRange(bHi, hi, tailVol * ((hi - bHi) / tailRange));
    }
    // Тело
    if (bodyRange > 0) {
      addRange(bLo, bHi, bodyVol);
    }
  }

  // 4) Преобразуем в массив точек
  const histogram = Array.from({ length: binCount }, (_, i) => ({
    price: +(minPrice + i * priceStep).toFixed(10),
    volume: bins[i],
  }));

  // 5) Метрики: суммарный объём, POC, Value Area 70%
  const totalVol = histogram.reduce((s, x) => s + x.volume, 0);
  let pocIdx = 0;
  for (let i = 1; i < histogram.length; i++) {
    if (histogram[i].volume > histogram[pocIdx].volume) pocIdx = i;
  }

  // Value Area: расширяем от POC, пока не соберём valueAreaPct от totalVol
  let cum = histogram[pocIdx].volume;
  let left = pocIdx - 1;
  let right = pocIdx + 1;
  while (cum < totalVol * valueAreaPct && (left >= 0 || right < histogram.length)) {
    const leftVol = left >= 0 ? histogram[left].volume : -1;
    const rightVol = right < histogram.length ? histogram[right].volume : -1;

    if (rightVol > leftVol) {
      cum += Math.max(0, rightVol);
      right++;
    } else {
      cum += Math.max(0, leftVol);
      left--;
    }
  }
  const valIdx = Math.max(0, left + 1);
  const vahIdx = Math.min(histogram.length - 1, right - 1);

  return {
    histogram,
    poc: { price: histogram[pocIdx].price, volume: histogram[pocIdx].volume, index: pocIdx },
    valueArea: {
      from: histogram[valIdx].price,
      to: histogram[vahIdx].price,
      coverage: valueAreaPct,
    },
    totalVolume: totalVol,
    meta: { priceStep, bodyWeight, valueAreaPct, minPrice, maxPrice },
  };
}

/**
 * Индикатор пробоя уровней с Volume Profile
 * Анализирует данные свечей и определяет потенциальные пробои
 */
export const BreakoutIndicator = {
  /**
   * Вычисляет Volume Profile для видимых свечей
   * @param {Array} klineData - массив данных свечей
   * @returns {Object} данные Volume Profile
   */
  calculateVolumeProfile: (klineData) => {
    if (!klineData || klineData.length === 0) {
      return { success: false, message: 'Нет данных для анализа Volume Profile' };
    }

    try {
      // Определяем шаг цены автоматически на основе данных
      const prices = klineData.flatMap(c => [c.high, c.low]);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;
      
      // Выбираем шаг цены для создания 50-100 корзин
      const targetBins = 75;
      const priceStep = priceRange / targetBins;
      
      // Адаптируем шаг к разумным значениям
      let adaptedStep;
      if (priceStep > 100) adaptedStep = Math.ceil(priceStep / 10) * 10;
      else if (priceStep > 10) adaptedStep = Math.ceil(priceStep);
      else if (priceStep > 1) adaptedStep = Math.ceil(priceStep * 10) / 10;
      else if (priceStep > 0.1) adaptedStep = Math.ceil(priceStep * 100) / 100;
      else adaptedStep = Math.ceil(priceStep * 1000) / 1000;

      console.log('📊 Расчет Volume Profile:', {
        priceRange: priceRange.toFixed(4),
        targetBins,
        calculatedStep: priceStep.toFixed(6),
        adaptedStep: adaptedStep.toFixed(6),
        dataPoints: klineData.length
      });

      const profile = buildVolumeProfile(klineData, {
        priceStep: adaptedStep,
        bodyWeight: 0.7,
        valueAreaPct: 0.7
      });

      if (!profile) {
        return { success: false, message: 'Не удалось построить Volume Profile' };
      }

      return {
        success: true,
        profile,
        message: `Volume Profile: POC ${profile.poc.price.toFixed(4)}, VA ${profile.valueArea.from.toFixed(4)}-${profile.valueArea.to.toFixed(4)}`
      };

    } catch (error) {
      console.error('❌ Ошибка расчета Volume Profile:', error);
      return { success: false, message: 'Ошибка при расчете Volume Profile' };
    }
  },

  /**
   * Рисует горизонтальные линии поддержки и сопротивления на графике
   * @param {Object} chart - экземпляр KLineChart
   * @param {Array} klineData - массив данных свечей
   * @param {string} interval - текущий таймфрейм
   * @returns {Object} информация о нарисованных линиях
   */
  drawSupportResistanceLines: (chart, klineData, interval = '1m') => {
    if (!chart || !klineData || klineData.length === 0) {
      return { success: false, message: 'Нет данных для анализа' };
    }

    let dataToAnalyze;
    let periodDescription;

    // Для всех таймфреймов - берем только видимые на экране свечи
    try {
      const visibleRange = chart.getVisibleRange();
      console.log('📊 Видимый диапазон:', JSON.stringify(visibleRange, null, 2));
      
      if (visibleRange && visibleRange.from !== undefined && visibleRange.to !== undefined) {
        // Видимый диапазон возвращает абсолютные индексы, не относительные!
        let startIndex = Math.max(0, Math.floor(visibleRange.from));
        let endIndex = Math.min(klineData.length, Math.ceil(visibleRange.to));
        
        // Убеждаемся, что индексы корректны
        if (startIndex >= klineData.length) startIndex = klineData.length - 100;
        if (endIndex <= startIndex) endIndex = startIndex + 50;
        if (endIndex > klineData.length) endIndex = klineData.length;
        
        dataToAnalyze = klineData.slice(startIndex, endIndex);
        periodDescription = `видимых на экране (${dataToAnalyze.length} свечей, индексы ${startIndex}-${endIndex})`;
        
        console.log('✅ Используем видимые свечи:', {
          originalFrom: visibleRange.from,
          originalTo: visibleRange.to,
          startIndex,
          endIndex,
          totalCandles: klineData.length,
          visibleCandles: dataToAnalyze.length,
          firstCandle: dataToAnalyze[0],
          lastCandle: dataToAnalyze[dataToAnalyze.length - 1]
        });
      } else {
        // Fallback: берем последние 100 свечей для лучшей видимости
        dataToAnalyze = klineData.slice(-100);
        periodDescription = `последних 100 свечей (fallback)`;
        
        console.log('⚠️ Используем fallback - последние 100 свечей');
      }
    } catch (error) {
      console.warn('❌ Ошибка получения видимого диапазона:', error);
      dataToAnalyze = klineData.slice(-100);
      periodDescription = `последних 100 свечей (после ошибки)`;
    }
    
    if (dataToAnalyze.length === 0) {
      return { success: false, message: 'Недостаточно данных для анализа' };
    }

    // Находим максимальную и минимальную цены среди видимых свечей
    const highestPrice = Math.max(...dataToAnalyze.map(candle => candle.high));
    const lowestPrice = Math.min(...dataToAnalyze.map(candle => candle.low));

    // Очищаем предыдущие линии (если есть)
    try {
      chart.removeOverlay();
    } catch (e) {
      console.log('Нет предыдущих линий для удаления');
    }

    console.log('📊 Начинаем анализ экстремумов:', {
      totalCandles: klineData.length,
      analyzedCandles: dataToAnalyze.length,
      highest: highestPrice,
      lowest: lowestPrice
    });

    // Добавляем линии на график
    try {
      // Используем правильный API KLineCharts для создания фигур
      const firstTimestamp = dataToAnalyze[0].timestamp;
      const lastTimestamp = dataToAnalyze[dataToAnalyze.length - 1].timestamp;

      // Создаем горизонтальную линию сопротивления
      const resistanceOverlay = {
        name: 'segment',
        id: 'resistance_line',
        groupId: 'support_resistance',
        points: [
          { timestamp: firstTimestamp, value: highestPrice },
          { timestamp: lastTimestamp, value: highestPrice }
        ],
        styles: {
          line: {
            color: '#007bff',
            size: 1,
            style: 'solid'
          }
        },
        extendLeft: true,
        extendRight: true
      };

      // Создаем горизонтальную линию поддержки
      const supportOverlay = {
        name: 'segment',
        id: 'support_line', 
        groupId: 'support_resistance',
        points: [
          { timestamp: firstTimestamp, value: lowestPrice },
          { timestamp: lastTimestamp, value: lowestPrice }
        ],
        styles: {
          line: {
            color: '#007bff',
            size: 1,
            style: 'solid'
          }
        },
        extendLeft: true,
        extendRight: true
      };

      console.log('🎯 Создаем линии:', {
        resistance: { timestamp: firstTimestamp, value: highestPrice },
        support: { timestamp: firstTimestamp, value: lowestPrice },
        timeRange: `${firstTimestamp} - ${lastTimestamp}`,
        resistanceOverlay: JSON.stringify(resistanceOverlay, null, 2),
        supportOverlay: JSON.stringify(supportOverlay, null, 2)
      });

      // Создаем оверлеи
      const resistanceId = chart.createOverlay(resistanceOverlay);
      const supportId = chart.createOverlay(supportOverlay);
      
      console.log('✅ Линии созданы с ID:', { resistanceId, supportId });
      
      return {
        success: true,
        message: `Экстремумы среди ${periodDescription}: Поддержка ${lowestPrice.toFixed(4)}, Сопротивление ${highestPrice.toFixed(4)}`,
        supportLevel: lowestPrice,
        resistanceLevel: highestPrice,
        candlesAnalyzed: dataToAnalyze.length,
        analysisType: 'visible_range'
      };
    } catch (error) {
      console.error('❌ Ошибка при рисовании линий:', error);
      
      // Пробуем самый простой способ - рисование фигур вручную
      try {
        console.log('🔄 Пробуем простые линии...');
        
        // Простые линии без расширения
        const simpleResistance = {
          name: 'line',
          points: [
            { timestamp: dataToAnalyze[0].timestamp, value: highestPrice },
            { timestamp: dataToAnalyze[dataToAnalyze.length - 1].timestamp, value: highestPrice }
          ],
          styles: {
            line: { color: '#007bff', size: 1 }
          }
        };

        const simpleSupport = {
          name: 'line',
          points: [
            { timestamp: dataToAnalyze[0].timestamp, value: lowestPrice },
            { timestamp: dataToAnalyze[dataToAnalyze.length - 1].timestamp, value: lowestPrice }
          ],
          styles: {
            line: { color: '#007bff', size: 1 }
          }
        };

        chart.createOverlay(simpleResistance);
        chart.createOverlay(simpleSupport);

        return {
          success: true,
          message: `Простые линии созданы. Поддержка: ${lowestPrice.toFixed(4)}, Сопротивление: ${highestPrice.toFixed(4)}`,
          supportLevel: lowestPrice,
          resistanceLevel: highestPrice,
          candlesAnalyzed: dataToAnalyze.length,
          analysisType: 'visible_range'
        };
        
      } catch (altError) {
        console.error('❌ И простые линии не работают:', altError);
        return {
          success: false,
          message: `Линии не рисуются. Поддержка: ${lowestPrice.toFixed(4)}, Сопротивление: ${highestPrice.toFixed(4)}. Данные доступны в консоли.`
        };
      }
    }
  },

  /**
   * Рисует линии Volume Profile на графике (POC и Value Area)
   * @param {Object} chart - экземпляр KLineChart
   * @param {Object} volumeProfile - данные Volume Profile
   * @param {Array} klineData - массив данных свечей для временных меток
   * @returns {Object} результат рисования
   */
  drawVolumeProfileLines: (chart, volumeProfile, klineData) => {
    if (!chart || !volumeProfile || !klineData.length) {
      return { success: false, message: 'Недостаточно данных для рисования Volume Profile' };
    }

    try {
      const firstTimestamp = klineData[0].timestamp;
      const lastTimestamp = klineData[klineData.length - 1].timestamp;

      // Линия POC (Point of Control) - самый торгуемый уровень
      const pocLine = {
        name: 'segment',
        id: 'poc_line',
        groupId: 'volume_profile',
        points: [
          { timestamp: firstTimestamp, value: volumeProfile.poc.price },
          { timestamp: lastTimestamp, value: volumeProfile.poc.price }
        ],
        styles: {
          line: {
            color: '#ff9800', // Оранжевый для POC
            size: 2,
            style: 'solid'
          }
        },
        extendLeft: true,
        extendRight: true
      };

      // Линия Value Area High (VAH)
      const vahLine = {
        name: 'segment',
        id: 'vah_line',
        groupId: 'volume_profile',
        points: [
          { timestamp: firstTimestamp, value: volumeProfile.valueArea.to },
          { timestamp: lastTimestamp, value: volumeProfile.valueArea.to }
        ],
        styles: {
          line: {
            color: '#4caf50', // Зеленый для VAH
            size: 1,
            style: 'dashed'
          }
        },
        extendLeft: true,
        extendRight: true
      };

      // Линия Value Area Low (VAL)
      const valLine = {
        name: 'segment',
        id: 'val_line',
        groupId: 'volume_profile',
        points: [
          { timestamp: firstTimestamp, value: volumeProfile.valueArea.from },
          { timestamp: lastTimestamp, value: volumeProfile.valueArea.from }
        ],
        styles: {
          line: {
            color: '#4caf50', // Зеленый для VAL
            size: 1,
            style: 'dashed'
          }
        },
        extendLeft: true,
        extendRight: true
      };

      console.log('🎯 Рисуем Volume Profile линии:', {
        poc: volumeProfile.poc.price.toFixed(4),
        vah: volumeProfile.valueArea.to.toFixed(4),
        val: volumeProfile.valueArea.from.toFixed(4)
      });

      // Создаем линии на графике
      chart.createOverlay(pocLine);
      chart.createOverlay(vahLine);
      chart.createOverlay(valLine);

      return {
        success: true,
        message: `Volume Profile нарисован: POC ${volumeProfile.poc.price.toFixed(4)}, VA ${volumeProfile.valueArea.from.toFixed(4)}-${volumeProfile.valueArea.to.toFixed(4)}`
      };

    } catch (error) {
      console.error('❌ Ошибка рисования Volume Profile:', error);
      return { success: false, message: 'Ошибка при рисовании Volume Profile' };
    }
  },

  /**
   * Очищает все индикаторы с графика
   * @param {Object} chart - экземпляр KLineChart
   * @returns {Object} результат очистки
   */
  clearAllIndicators: (chart) => {
    if (!chart) {
      return { success: false, message: 'График недоступен' };
    }

    try {
      // Очищаем все оверлеи
      chart.removeOverlay();
      
      console.log('🧹 Все индикаторы очищены');
      
      return {
        success: true,
        message: 'Все индикаторы убраны с графика'
      };
    } catch (error) {
      console.error('❌ Ошибка при очистке индикаторов:', error);
      return {
        success: false,
        message: 'Ошибка при очистке индикаторов'
      };
    }
  },

  /**
   * Анализ пробоя уровней на основе данных свечей
   * @param {Array} klineData - массив данных свечей
   * @param {Object} options - настройки анализа
   * @returns {Object} результат анализа пробоя
   */
  analyzeBreakout: (klineData, options = {}) => {
    const {
      lookbackPeriod = 20,     // период для поиска уровней
      volumeThreshold = 1.5,   // минимальное увеличение объема
      priceThreshold = 0.002   // минимальное изменение цены (0.2%)
    } = options;

    if (!klineData || klineData.length < lookbackPeriod) {
      return {
        hasBreakout: false,
        message: 'Недостаточно данных для анализа'
      };
    }

    // Получаем последние данные
    const recentData = klineData.slice(-lookbackPeriod);
    const currentCandle = recentData[recentData.length - 1];
    const previousCandles = recentData.slice(0, -1);

    // Находим уровни поддержки и сопротивления
    const supportLevel = Math.min(...previousCandles.map(candle => candle.low));
    const resistanceLevel = Math.max(...previousCandles.map(candle => candle.high));

    // Средний объем за период
    const avgVolume = previousCandles.reduce((sum, candle) => sum + candle.volume, 0) / previousCandles.length;

    // Проверяем пробой вверх (сопротивления)
    const breakoutUp = currentCandle.close > resistanceLevel * (1 + priceThreshold);
    
    // Проверяем пробой вниз (поддержки)
    const breakoutDown = currentCandle.close < supportLevel * (1 - priceThreshold);

    // Проверяем увеличение объема
    const volumeConfirmation = currentCandle.volume > avgVolume * volumeThreshold;

    let result = {
      hasBreakout: false,
      direction: null,
      strength: 'weak',
      supportLevel,
      resistanceLevel,
      currentPrice: currentCandle.close,
      volumeRatio: currentCandle.volume / avgVolume,
      message: 'Пробоя не обнаружено'
    };

    if (breakoutUp && volumeConfirmation) {
      result = {
        ...result,
        hasBreakout: true,
        direction: 'up',
        strength: 'strong',
        message: `🚀 Пробой сопротивления! Цена: ${currentCandle.close.toFixed(4)}, Уровень: ${resistanceLevel.toFixed(4)}`
      };
    } else if (breakoutUp) {
      result = {
        ...result,
        hasBreakout: true,
        direction: 'up',
        strength: 'weak',
        message: `⬆️ Слабый пробой сопротивления (низкий объем)`
      };
    } else if (breakoutDown && volumeConfirmation) {
      result = {
        ...result,
        hasBreakout: true,
        direction: 'down',
        strength: 'strong',
        message: `📉 Пробой поддержки! Цена: ${currentCandle.close.toFixed(4)}, Уровень: ${supportLevel.toFixed(4)}`
      };
    } else if (breakoutDown) {
      result = {
        ...result,
        hasBreakout: true,
        direction: 'down',
        strength: 'weak',
        message: `⬇️ Слабый пробой поддержки (низкий объем)`
      };
    }

    return result;
  },

  /**
   * Форматирование результата для отображения
   */
  formatResult: (analysis) => {
    const baseResult = {
      color: 'text-muted',
      icon: '📊',
      text: analysis.message,
      details: []
    };

    // Добавляем информацию о линиях экстремумов
    if (analysis.linesDrawn) {
      baseResult.details.push(`✅ ${analysis.linesMessage}`);
    }

    // Добавляем информацию о Volume Profile
    if (analysis.volumeProfile) {
      const vp = analysis.volumeProfile;
      baseResult.details.push(`📈 ${analysis.volumeProfileMessage}`);
      baseResult.details.push(`🟠 POC: ${vp.poc.price.toFixed(4)} (${vp.poc.volume.toFixed(0)} vol)`);
      baseResult.details.push(`🟢 Value Area: ${vp.valueArea.from.toFixed(4)} - ${vp.valueArea.to.toFixed(4)}`);
      baseResult.details.push(`📊 Всего объем: ${vp.totalVolume.toFixed(0)}, корзин: ${vp.histogram.length}`);
      
      if (analysis.vpLinesDrawn) {
        baseResult.details.push('✅ Volume Profile линии нарисованы');
      }
    } else if (analysis.volumeProfileMessage) {
      baseResult.details.push(`❌ Volume Profile: ${analysis.volumeProfileMessage}`);
    }

    if (!analysis.hasBreakout) {
      return baseResult;
    }

    const colors = {
      up: analysis.strength === 'strong' ? 'text-success' : 'text-warning',
      down: analysis.strength === 'strong' ? 'text-danger' : 'text-warning'
    };

    return {
      color: colors[analysis.direction],
      icon: analysis.direction === 'up' ? '🚀' : '📉',
      text: analysis.message,
      details: [
        ...baseResult.details,
        `🔴 Поддержка: ${analysis.supportLevel.toFixed(4)}`,
        `🔴 Сопротивление: ${analysis.resistanceLevel.toFixed(4)}`,
        `📊 Объем: ${(analysis.volumeRatio * 100).toFixed(0)}% от среднего`
      ]
    };
  }
};

/**
 * React компонент для отображения результатов анализа пробоя в виде popover
 */
export const BreakoutDisplay = ({ analysis, onClose }) => {
  if (!analysis) return null;

  const formatted = BreakoutIndicator.formatResult(analysis);

  return (
    <div className="position-relative">
      <div 
        className="popover bs-popover-bottom show" 
        role="tooltip" 
        style={{
          position: 'absolute',
          top: '0px',
          left: '0px',
          right: '0px',
          zIndex: 1070,
          maxWidth: '500px',
          minWidth: '300px'
        }}
      >
        <div className="popover-arrow" style={{ left: '20px' }}></div>
        <div className="popover-header d-flex justify-content-between align-items-center">
          <span className="d-flex align-items-center">
            <span className="me-2" style={{ fontSize: '1.1em' }}>{formatted.icon}</span>
            <strong className={formatted.color} style={{ fontSize: '0.9em' }}>
              {formatted.text}
            </strong>
          </span>
          {onClose && (
            <button 
              type="button" 
              className="btn-close btn-close-sm" 
              onClick={onClose}
              aria-label="Close"
              style={{ fontSize: '0.8em' }}
            ></button>
          )}
        </div>
        {formatted.details && formatted.details.length > 0 && (
          <div className="popover-body">
            {formatted.details.map((detail, index) => (
              <div 
                key={index} 
                className="small text-muted mb-1"
                style={{ fontSize: '0.8em', lineHeight: '1.3' }}
              >
                {detail}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BreakoutIndicator;