import React, { useState, useMemo } from 'react';
import { mockStocks, sectors, exchanges } from '../data/mockData';
import FilterPanel from './FilterPanel';
import StockTable from './StockTable';

export default function Screener() {
  const [filters, setFilters] = useState({
    search: '',
    sector: 'All',
    exchange: 'All',
    minPrice: '',
    maxPrice: '',
    minMarketCap: '',
    maxMarketCap: '',
    minPE: '',
    maxPE: '',
    sortBy: 'symbol',
    sortOrder: 'asc'
  });

  const filteredAndSortedStocks = useMemo(() => {
    let filtered = mockStocks.filter(stock => {
      // Поиск по символу или названию
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!stock.symbol.toLowerCase().includes(searchLower) && 
            !stock.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Фильтр по сектору
      if (filters.sector !== 'All' && stock.sector !== filters.sector) {
        return false;
      }

      // Фильтр по бирже
      if (filters.exchange !== 'All' && stock.exchange !== filters.exchange) {
        return false;
      }

      // Фильтр по цене
      if (filters.minPrice && stock.price < parseFloat(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice && stock.price > parseFloat(filters.maxPrice)) {
        return false;
      }

      // Фильтр по рыночной капитализации (в миллиардах)
      const marketCapBillions = stock.marketCap / 1000000000;
      if (filters.minMarketCap && marketCapBillions < parseFloat(filters.minMarketCap)) {
        return false;
      }
      if (filters.maxMarketCap && marketCapBillions > parseFloat(filters.maxMarketCap)) {
        return false;
      }

      // Фильтр по P/E
      if (filters.minPE && stock.peRatio < parseFloat(filters.minPE)) {
        return false;
      }
      if (filters.maxPE && stock.peRatio > parseFloat(filters.maxPE)) {
        return false;
      }

      return true;
    });

    // Сортировка
    filtered.sort((a, b) => {
      let aValue = a[filters.sortBy];
      let bValue = b[filters.sortBy];

      // Обработка строковых значений
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      sector: 'All',
      exchange: 'All',
      minPrice: '',
      maxPrice: '',
      minMarketCap: '',
      maxMarketCap: '',
      minPE: '',
      maxPE: '',
      sortBy: 'symbol',
      sortOrder: 'asc'
    });
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Stock Screener</h1>
      </div>

      <div className="card">
        <FilterPanel 
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={resetFilters}
          sectors={sectors}
          exchanges={exchanges}
        />
      </div>

      <div className="card">
        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Результаты: {filteredAndSortedStocks.length} акций</h3>
        </div>
        
        <StockTable 
          stocks={filteredAndSortedStocks}
          onSort={handleSort}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
        />
      </div>
    </div>
  );
}