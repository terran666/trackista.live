import React, { useState } from 'react';
import CoinListSidebar from './CoinListSidebar';
import KLineChart from './KLineChart';

export default function ChartPage() {
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [activeTab, setActiveTab] = useState('spot');
  const [interval, setInterval] = useState('1m');

  return (
    <div className="container-fluid p-0 chart-page-container" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="row g-0 h-100">
        <div className="col-lg-3 h-100 chart-sidebar">
          <CoinListSidebar 
            onCoinSelect={setSelectedCoin}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
        <div className="col-lg-9 h-100 chart-main">
          <div className="p-3 h-100 d-flex flex-column">
            <KLineChart 
              symbol={selectedCoin?.id}
              interval={interval}
              spot={activeTab === 'spot'}
              onIntervalChange={setInterval}
              fullHeight={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}