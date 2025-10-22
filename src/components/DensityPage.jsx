import React, { useState, useEffect } from 'react';
import CoinData from './CoinData';
import OrderbookDensity from './OrderbookDensity';

const DEFAULT_SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"]; // Уменьшили до 4 символов

export default function DensityPage() {
  const [isCompactView, setIsCompactView] = useState(true); // По умолчанию двойной ряд активен
  const [isSpot, setIsSpot] = useState(true);
  const [visibleSymbols, setVisibleSymbols] = useState([]); // Для поэтапной загрузки

  const toggleCompactView = () => {
    setIsCompactView(!isCompactView);
  };

  const toggleMarketType = (spot) => {
    setIsSpot(spot);
  };

  // Поэтапная загрузка символов
  useEffect(() => {
    setVisibleSymbols([]); // Сброс при загрузке
    
    DEFAULT_SYMBOLS.forEach((symbol, index) => {
      setTimeout(() => {
        setVisibleSymbols(prev => [...prev, symbol]);
      }, index * 1000); // Задержка 1 секунда между символами
    });
  }, []);

  return (
    <div className="container-fluid p-4">
      {/* Заголовок и управление */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>📊 Плотность Orderbook</h2>
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
          
          {/* Кнопка обновления */}
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => {
              setVisibleSymbols([]);
              setTimeout(() => {
                DEFAULT_SYMBOLS.forEach((symbol, index) => {
                  setTimeout(() => {
                    setVisibleSymbols(prev => [...prev, symbol]);
                  }, index * 800); // Быстрее перезагружаем
                });
              }, 100);
            }}
            title="Обновить все данные"
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

      {/* Информационная панель */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body text-center py-2">
              <h6 className="card-title mb-1">Загружено</h6>
              <h4>{visibleSymbols.length}/{DEFAULT_SYMBOLS.length}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body text-center py-2">
              <h6 className="card-title mb-1">Bid стенки</h6>
              <h4>📈</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body text-center py-2">
              <h6 className="card-title mb-1">Ask стенки</h6>
              <h4>📉</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body text-center py-2">
              <h6 className="card-title mb-1">WebSocket</h6>
              <h4>🔄</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Список монет с анализом плотности */}
      <div className="row g-3">
        {DEFAULT_SYMBOLS.map((symbol, index) => (
          <div key={symbol} className={isCompactView ? "col-lg-6" : "col-12"}>
            <div className="card" style={{ height: '320px' }}>
              <div className="card-body p-0" style={{ height: '100%' }}>
                {visibleSymbols.includes(symbol) ? (
                  <div className="row g-0 h-100">
                    {/* Левая часть - данные монеты */}
                    <div className={isCompactView ? "col-md-4" : "col-md-3"}>
                      <CoinData symbol={symbol} index={index} spot={isSpot} />
                    </div>
                    
                    {/* Правая часть - визуализация плотности */}
                    <div className={isCompactView ? "col-md-8" : "col-md-9"} style={{ height: '100%' }}>
                      <OrderbookDensity symbol={symbol} spot={isSpot} />
                    </div>
                  </div>
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="text-center">
                      <div className="spinner-border text-primary mb-2" role="status">
                        <span className="visually-hidden">Загрузка...</span>
                      </div>
                      <h6 className="text-muted">Подготовка {symbol}</h6>
                      <small className="text-muted">Подключение к WebSocket...</small>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Инструкция */}

    </div>
  );
}