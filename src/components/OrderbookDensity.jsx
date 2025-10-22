import React, { useState, useEffect } from 'react';
import { useBinanceOrderbook, secsToHMS } from '../hooks/useOrderbook';
import KLineChart from './KLineChart';

export default function OrderbookDensity({ symbol, spot = true }) {
  const [isVisible, setIsVisible] = useState(false);
  const { walls, stats, fmt, timer, connectionStatus } = useBinanceOrderbook(symbol);

  // Добавляем задержку для загрузки графика
  useEffect(() => {
    const delay = Math.random() * 2000; // Случайная задержка 0-2 секунды
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  if (!stats.midPrice) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100">
        <div className="text-center">
          <div className="spinner-border spinner-border-sm text-primary mb-2" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
          <small className="text-muted">Подключение к {symbol}</small>
        </div>
      </div>
    );
  }

  const maxWallValue = Math.max(
    ...(walls.bidWalls || []).map(w => w.total),
    ...(walls.askWalls || []).map(w => w.total),
    1
  );

  return (
    <div className="p-2" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0 small">{symbol}</h6>
        <small className="text-muted">{secsToHMS(timer)}</small>
      </div>

      {/* Обычный KLine график */}
      <div className="mb-2 flex-grow-1" style={{ 
        minHeight: '200px', 
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100%',
        position: 'relative'
      }}>
        {isVisible ? (
          <KLineChart 
            symbol={symbol}
            interval="5m"
            spot={spot}
            compact={true}
            limit={100}
          />
        ) : (
          <div className="d-flex align-items-center justify-content-center h-100">
            <div className="text-center">
              <div className="spinner-border spinner-border-sm text-secondary mb-2" role="status">
                <span className="visually-hidden">Подготовка графика...</span>
              </div>
              <small className="text-muted">Загрузка графика {symbol}</small>
            </div>
          </div>
        )}
      </div>
      

    </div>
  );
}