import React from 'react';

export default function StockTable({ stocks, onSort, sortBy, sortOrder }) {
  const formatNumber = (num, decimals = 2) => {
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const formatMarketCap = (marketCap) => {
    const billions = marketCap / 1000000000;
    if (billions >= 1000) {
      return `$${(billions / 1000).toFixed(1)}T`;
    }
    return `$${billions.toFixed(1)}B`;
  };

  const formatVolume = (volume) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(0)}K`;
    }
    return volume.toLocaleString();
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleHeaderClick = (field) => {
    onSort(field);
  };

  if (stocks.length === 0) {
    return (
      <div className="loading">
        Нет акций, соответствующих выбранным фильтрам
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th onClick={() => handleHeaderClick('symbol')}>
              Символ {getSortIcon('symbol')}
            </th>
            <th onClick={() => handleHeaderClick('name')}>
              Название {getSortIcon('name')}
            </th>
            <th onClick={() => handleHeaderClick('price')}>
              Цена {getSortIcon('price')}
            </th>
            <th onClick={() => handleHeaderClick('change')}>
              Изменение {getSortIcon('change')}
            </th>
            <th onClick={() => handleHeaderClick('changePercent')}>
              % {getSortIcon('changePercent')}
            </th>
            <th onClick={() => handleHeaderClick('volume')}>
              Объем {getSortIcon('volume')}
            </th>
            <th onClick={() => handleHeaderClick('marketCap')}>
              Рын. кап. {getSortIcon('marketCap')}
            </th>
            <th onClick={() => handleHeaderClick('peRatio')}>
              P/E {getSortIcon('peRatio')}
            </th>
            <th onClick={() => handleHeaderClick('sector')}>
              Сектор {getSortIcon('sector')}
            </th>
            <th onClick={() => handleHeaderClick('dividendYield')}>
              Дивиденд % {getSortIcon('dividendYield')}
            </th>
          </tr>
        </thead>
        <tbody>
          {stocks.map(stock => (
            <tr key={stock.id}>
              <td>
                <strong>{stock.symbol}</strong>
              </td>
              <td>{stock.name}</td>
              <td>${formatNumber(stock.price)}</td>
              <td className={stock.change >= 0 ? 'positive' : 'negative'}>
                {stock.change >= 0 ? '+' : ''}{formatNumber(stock.change)}
              </td>
              <td className={stock.changePercent >= 0 ? 'positive' : 'negative'}>
                {stock.changePercent >= 0 ? '+' : ''}{formatNumber(stock.changePercent)}%
              </td>
              <td>{formatVolume(stock.volume)}</td>
              <td>{formatMarketCap(stock.marketCap)}</td>
              <td>{formatNumber(stock.peRatio, 1)}</td>
              <td>
                <span style={{ 
                  fontSize: '12px', 
                  backgroundColor: '#e2e8f0', 
                  padding: '2px 6px', 
                  borderRadius: '4px' 
                }}>
                  {stock.sector}
                </span>
              </td>
              <td>
                {stock.dividendYield > 0 
                  ? `${formatNumber(stock.dividendYield)}%` 
                  : '-'
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}