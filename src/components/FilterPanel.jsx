import React from 'react';

export default function FilterPanel({ filters, onFilterChange, onReset, sectors, exchanges }) {
  const handleInputChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Фильтры</h3>
        <button className="btn btn-secondary" onClick={onReset}>
          Сбросить фильтры
        </button>
      </div>

      <div className="filters">
        {/* Поиск */}
        <div className="filter-group">
          <label>Поиск</label>
          <input
            type="text"
            className="input"
            placeholder="Символ или название..."
            value={filters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            style={{ width: '200px' }}
          />
        </div>

        {/* Сектор */}
        <div className="filter-group">
          <label>Сектор</label>
          <select
            className="input"
            value={filters.sector}
            onChange={(e) => handleInputChange('sector', e.target.value)}
            style={{ width: '180px' }}
          >
            {sectors.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>

        {/* Биржа */}
        <div className="filter-group">
          <label>Биржа</label>
          <select
            className="input"
            value={filters.exchange}
            onChange={(e) => handleInputChange('exchange', e.target.value)}
            style={{ width: '120px' }}
          >
            {exchanges.map(exchange => (
              <option key={exchange} value={exchange}>{exchange}</option>
            ))}
          </select>
        </div>

        {/* Цена */}
        <div className="filter-group">
          <label>Цена ($)</label>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <input
              type="number"
              className="input"
              placeholder="От"
              value={filters.minPrice}
              onChange={(e) => handleInputChange('minPrice', e.target.value)}
              style={{ width: '80px' }}
            />
            <span>-</span>
            <input
              type="number"
              className="input"
              placeholder="До"
              value={filters.maxPrice}
              onChange={(e) => handleInputChange('maxPrice', e.target.value)}
              style={{ width: '80px' }}
            />
          </div>
        </div>

        {/* Рыночная капитализация */}
        <div className="filter-group">
          <label>Рын. кап. (млрд $)</label>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <input
              type="number"
              className="input"
              placeholder="От"
              value={filters.minMarketCap}
              onChange={(e) => handleInputChange('minMarketCap', e.target.value)}
              style={{ width: '80px' }}
            />
            <span>-</span>
            <input
              type="number"
              className="input"
              placeholder="До"
              value={filters.maxMarketCap}
              onChange={(e) => handleInputChange('maxMarketCap', e.target.value)}
              style={{ width: '80px' }}
            />
          </div>
        </div>

        {/* P/E соотношение */}
        <div className="filter-group">
          <label>P/E</label>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <input
              type="number"
              className="input"
              placeholder="От"
              value={filters.minPE}
              onChange={(e) => handleInputChange('minPE', e.target.value)}
              style={{ width: '80px' }}
            />
            <span>-</span>
            <input
              type="number"
              className="input"
              placeholder="До"
              value={filters.maxPE}
              onChange={(e) => handleInputChange('maxPE', e.target.value)}
              style={{ width: '80px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}