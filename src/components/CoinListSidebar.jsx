import React, { useState } from 'react';
import { useBinanceScreener, useBinanceFutures } from '../hooks/useBinance';
import { formatPrice, formatVolume, formatPercent, getPriceChangeColor } from '../utils/cryptoUtils';

export default function CoinListSidebar({ onCoinSelect, activeTab: parentActiveTab, onTabChange }) {
  const activeTab = parentActiveTab || 'spot';
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('quoteVolume'); // Поле для сортировки
  const [sortOrder, setSortOrder] = useState('desc'); // Порядок сортировки
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [colorPopover, setColorPopover] = useState({ show: false, coinId: null, position: { x: 0, y: 0 } });
  const [coinColors, setCoinColors] = useState({}); // Хранение выбранных цветов для монет
  
  // Доступные цвета для выбора
  const availableColors = [
    { name: 'Красный', value: '#dc3545' },
    { name: 'Зеленый', value: '#28a745' },
    { name: 'Синий', value: '#007bff' },
    { name: 'Оранжевый', value: '#fd7e14' },
    { name: 'Фиолетовый', value: '#6f42c1' }
  ];
  
  // Порядок колонок (можно менять)
  const [columnOrder, setColumnOrder] = useState([
    { key: 'color', title: '●', field: null, width: 'col-1', center: true },
    { key: 'symbol', title: 'МОНЕТА', field: 'symbol', width: 'col-2', center: false },
    { key: 'count', title: 'СДЕЛКИ', field: 'count', width: 'col-2', center: true },
    { key: 'volume', title: 'ОБЪЕМ 24Ч', field: 'quoteVolume', width: 'col-2', center: true },
    { key: 'change', title: 'ЦЕНА 24Ч', field: 'changePercent', width: 'col-2', center: true },
    { key: 'volatility', title: 'ВОЛ24', field: 'volatility', width: 'col-3', center: true }
  ]);
  
  // Получаем данные в зависимости от активной вкладки
  const { data: spotCoins, loading: spotLoading, error: spotError } = useBinanceScreener(2000);
  const { data: futuresCoins, loading: futuresLoading, error: futuresError } = useBinanceFutures(1000);
  
  // Выбираем данные в зависимости от активной вкладки
  const allCoins = activeTab === 'spot' ? spotCoins : futuresCoins;
  const loading = activeTab === 'spot' ? spotLoading : futuresLoading;
  const error = activeTab === 'spot' ? spotError : futuresError;
  
  // Фильтруем и сортируем монеты
  const coins = allCoins ? 
    allCoins
      .filter(coin => {
        // Фильтр по объему
        if (coin.quoteVolume <= 100000) return false;
        
        // Фильтр по типу (спот/фьючерсы)
        if (activeTab === 'spot') {
          // Для спота берем только USDT пары
          return coin.id.endsWith('USDT');
        } else if (activeTab === 'futures') {
          // Для фьючерсов можно добавить специальную логику
          // Пока используем те же USDT пары, но с другой сортировкой
          return coin.id.endsWith('USDT');
        }
        
        return true;
      })
      .map(coin => ({
        ...coin,
        volatility: coin.high24h && coin.low24h ? 
          ((coin.high24h - coin.low24h) / coin.low24h) * 100 : 0
      }))
      .sort((a, b) => {
        // Сначала сортируем по наличию цветовой метки
        const aHasColor = coinColors[a.id] ? 1 : 0;
        const bHasColor = coinColors[b.id] ? 1 : 0;
        
        if (aHasColor !== bHasColor) {
          return bHasColor - aHasColor; // Помеченные цветом сверху
        }
        
        // Если обе монеты имеют цвет, группируем по цвету
        if (aHasColor && bHasColor) {
          const aColor = coinColors[a.id];
          const bColor = coinColors[b.id];
          
          if (aColor !== bColor) {
            // Сортируем цвета в определенном порядке для стабильной группировки
            const colorOrder = ['#dc3545', '#198754', '#0d6efd', '#ffc107', '#6f42c1'];
            const aColorIndex = colorOrder.indexOf(aColor);
            const bColorIndex = colorOrder.indexOf(bColor);
            return aColorIndex - bColorIndex;
          }
        }
        
        // Затем по выбранному полю
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        // Обработка строковых значений
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      }) : [];

  // Функция для обработки клика по заголовку колонки
  const handleSort = (field) => {
    if (sortField === field) {
      // Если кликнули по той же колонке, меняем порядок
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Если кликнули по новой колонке, устанавливаем её с убывающим порядком
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Функция для получения иконки сортировки
  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Функции для drag & drop
  const handleDragStart = (e, columnIndex) => {
    setDraggedColumn(columnIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    
    if (draggedColumn === null || draggedColumn === targetIndex) return;
    
    const newColumnOrder = [...columnOrder];
    const draggedItem = newColumnOrder[draggedColumn];
    
    // Убираем элемент из старой позиции
    newColumnOrder.splice(draggedColumn, 1);
    
    // Вставляем элемент в новую позицию
    newColumnOrder.splice(targetIndex, 0, draggedItem);
    
    setColumnOrder(newColumnOrder);
    setDraggedColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  // Функции для цветового попапа
  const handleColorDotClick = (e, coinId) => {
    e.stopPropagation();
    const rect = e.target.getBoundingClientRect();
    setColorPopover({
      show: true,
      coinId: coinId,
      position: {
        x: rect.right + 10,
        y: rect.top
      }
    });
  };

  const handleColorSelect = (color) => {
    if (colorPopover.coinId) {
      setCoinColors(prev => ({
        ...prev,
        [colorPopover.coinId]: color
      }));
    }
    setColorPopover({ show: false, coinId: null, position: { x: 0, y: 0 } });
  };

  const removeColorMark = () => {
    if (colorPopover.coinId) {
      setCoinColors(prev => {
        const newColors = { ...prev };
        delete newColors[colorPopover.coinId];
        return newColors;
      });
    }
    setColorPopover({ show: false, coinId: null, position: { x: 0, y: 0 } });
  };

  // Закрытие попапа при клике вне его
  const handleClickOutside = () => {
    setColorPopover({ show: false, coinId: null, position: { x: 0, y: 0 } });
  };

  // Отмена цвета по правому клику
  const handleColorRemove = (e, coinId) => {
    e.preventDefault();
    e.stopPropagation();
    
    setCoinColors(prev => {
      const newColors = { ...prev };
      delete newColors[coinId];
      return newColors;
    });
  };

  return (
    <div className="h-100 bg-light border-start" style={{ minWidth: 0, overflow: 'hidden' }}>
      {/* Заголовок и кнопки */}
      <div className="p-3 border-bottom">
        {/* Кнопки Спот/Фьючерсы */}
        <div className="btn-group w-100 mb-3" role="group">
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'spot' ? 'btn-success' : ''}`}
            style={{
              backgroundColor: activeTab === 'spot' ? '#28a745' : 'transparent',
              borderColor: activeTab === 'spot' ? '#28a745' : '#dee2e6',
              borderWidth: activeTab === 'spot' ? '2px' : '1px',
              borderStyle: 'solid',
              color: activeTab === 'spot' ? 'white' : '#6c757d',
              fontWeight: activeTab === 'spot' ? 'bold' : 'normal'
            }}
            onClick={() => onTabChange && onTabChange('spot')}
          >
            Спот
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'futures' ? 'btn-warning' : ''}`}
            style={{
              backgroundColor: activeTab === 'futures' ? '#fd7e14' : 'transparent',
              borderColor: activeTab === 'futures' ? '#fd7e14' : '#dee2e6',
              borderWidth: activeTab === 'futures' ? '2px' : '1px',
              borderStyle: 'solid',
              color: activeTab === 'futures' ? 'white' : '#6c757d',
              fontWeight: activeTab === 'futures' ? 'bold' : 'normal'
            }}
            onClick={() => onTabChange && onTabChange('futures')}
          >
            Фьючерсы
          </button>
        </div>

        {/* Поле поиска с настройками */}
        <div className="d-flex gap-2">
          <div className="position-relative flex-grow-1">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Поиск монет..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="position-absolute top-50 end-0 translate-middle-y me-2">
              🔍
            </span>
          </div>
          <button className="btn btn-sm btn-outline-secondary p-1" title="Настройки">
            ⚙️
          </button>
        </div>
      </div>

      {/* Заголовок списка */}
      <div className="px-2 py-2 bg-secondary bg-opacity-10 border-bottom">
        <div className="row align-items-center">
          {columnOrder.map((column, index) => (
            <div
              key={column.key}
              className={`${column.width} ${column.center ? 'text-center' : ''}`}
              style={{ 
                cursor: column.field ? 'grab' : 'default',
                opacity: draggedColumn === index ? 0.5 : 1,
                backgroundColor: draggedColumn === index ? '#e9ecef' : 'transparent'
              }}
              draggable={column.field !== null}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={column.field ? () => handleSort(column.field) : undefined}
            >
              <small className="text-muted fw-bold">{column.title}</small>
            </div>
          ))}
        </div>
      </div>

      {/* Список монет */}
      <div className="p-2" style={{ height: 'calc(100vh - 320px)', overflowY: 'auto' }}>
        {loading && (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Загрузка...</span>
            </div>
            <div className="mt-2 small text-muted">Загрузка монет...</div>
          </div>
        )}

        {error && (
          <div className="text-danger text-center py-4 small">
            Ошибка загрузки данных
          </div>
        )}

        {!loading && !error && coins && (
          <>
            {coins
              .filter(coin => 
                searchTerm === '' || 
                coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .slice(0, 200)
              .map((coin) => (
                <div
                  key={coin.id}
                  className="p-2 border-bottom small"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => e.target.closest('div').style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.target.closest('div').style.backgroundColor = 'transparent'}
                  onClick={() => onCoinSelect && onCoinSelect(coin)}
                >
                  <div className="row align-items-center">
                    {columnOrder.map((column) => {
                      const renderCellContent = () => {
                        switch (column.key) {
                          case 'color':
                            const customColor = coinColors[coin.id];
                            const defaultColor = coin.changePercent > 0 ? '#28a745' : 
                                                coin.changePercent < 0 ? '#dc3545' : '#6c757d';
                            
                            return (
                              <div 
                                style={{ 
                                  fontSize: '1.2rem', 
                                  cursor: 'pointer',
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  backgroundColor: 'white',
                                  border: `2px solid ${customColor || '#dee2e6'}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="ЛКМ - выбрать цвет, ПКМ - отменить"
                                onClick={(e) => handleColorDotClick(e, coin.id)}
                                onContextMenu={(e) => handleColorRemove(e, coin.id)}
                              >
                              </div>
                            );
                          case 'symbol':
                            return <div className="fw-bold" style={{ fontSize: '0.8rem' }}>{coin.symbol}</div>;
                          case 'count':
                            return (
                              <div className="text-muted">
                                {coin.count ? (coin.count > 1000 ? `${Math.round(coin.count/1000)}K` : coin.count) : '-'}
                              </div>
                            );
                          case 'volume':
                            return <div className="text-muted">{formatVolume(coin.quoteVolume)}</div>;
                          case 'change':
                            return (
                              <div className={getPriceChangeColor(coin.changePercent)}>
                                {formatPercent(coin.changePercent)}
                              </div>
                            );
                          case 'volatility':
                            return (
                              <div className="text-muted">
                                {coin.volatility > 0 ? `${coin.volatility.toFixed(1)}%` : '-'}
                              </div>
                            );
                          default:
                            return null;
                        }
                      };

                      return (
                        <div key={column.key} className={`${column.width} ${column.center ? 'text-center' : ''}`}>
                          {renderCellContent()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            }
            
            {coins && coins.filter(coin => 
              searchTerm === '' || 
              coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
            ).length === 0 && (
              <div className="text-muted text-center py-4 small">
                Монеты не найдены
              </div>
            )}
          </>
        )}
      </div>

      {/* Цветовой попап */}
      {colorPopover.show && (
        <>
          <div 
            className="position-fixed w-100 h-100" 
            style={{ top: 0, left: 0, zIndex: 998 }}
            onClick={handleClickOutside}
          />
          <div
            className="position-fixed bg-white border rounded shadow-lg p-2"
            style={{
              left: colorPopover.position.x,
              top: colorPopover.position.y,
              zIndex: 999,
              minWidth: '150px'
            }}
          >
            <div className="mb-2">
              <small className="text-muted fw-bold">Выберите цвет:</small>
            </div>
            <div className="d-flex flex-wrap gap-2 mb-2">
              {availableColors.map((color) => (
                <div
                  key={color.name}
                  className="border"
                  style={{
                    width: '25px',
                    height: '25px',
                    backgroundColor: color.value,
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                  title={color.name}
                  onClick={() => handleColorSelect(color.value)}
                />
              ))}
            </div>
            <button 
              className="btn btn-sm btn-outline-secondary w-100"
              onClick={removeColorMark}
            >
              Убрать метку
            </button>
          </div>
        </>
      )}
    </div>
  );
}