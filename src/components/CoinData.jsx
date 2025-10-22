import React from 'react';
import { useBinanceOrderbook, secsToHMS } from '../hooks/useOrderbook';

export default function CoinData({ symbol, index, spot = true }) {
  const { stats, fmt, walls } = useBinanceOrderbook(symbol);

  const renderOrderbookWalls = () => {
    const topBidWalls = (walls.bidWalls || []).slice(0, 3);
    const topAskWalls = (walls.askWalls || []).slice(0, 3);

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div className="fw-bold text-primary text-center" style={{ fontSize: '11px', flexShrink: 0 }}>📊 Стенки</div>
        
        {/* ASK стенки (продажи) - сверху */}
        {topAskWalls.length > 0 && (
          <div style={{ flexShrink: 0 }}>
            <div className="text-danger fw-bold text-center" style={{ fontSize: '9px' }}>🔴 ASK</div>
            {topAskWalls.slice(0, 1).map((wall, idx) => (
              <div key={`ask-${idx}`} className="mb-1 p-1" style={{ backgroundColor: '#fff2f2', border: '1px solid #ffe6e6', borderRadius: '2px', minWidth: 0, overflow: 'hidden' }}>
                <div className="d-flex justify-content-between" style={{ minWidth: 0 }}>
                  <span className="fw-bold" style={{ fontSize: '9px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>${fmt(wall.price, 1)}</span>
                  <span className="text-danger" style={{ fontSize: '9px', flexShrink: 0 }}>${fmt(wall.total / 1000000, 1)}M</span>
                </div>
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: '7px', lineHeight: '1', minWidth: 0 }}>
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{secsToHMS(wall.lifeTime)}</span>
                  <span style={{ minWidth: 0, flexShrink: 0 }}>+{fmt(wall.distancePercent, 1)}%</span>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Средняя цена */}
        <div className="text-center p-1" style={{ backgroundColor: '#f8f9fa', border: '1px dashed #6c757d', borderRadius: '2px', flexShrink: 0 }}>
          <div className="fw-bold text-info" style={{ fontSize: '9px' }}>${fmt(stats.midPrice, 1)}</div>
        </div>

        {/* BID стенки (покупки) - снизу */}
        {topBidWalls.length > 0 && (
          <div style={{ flexShrink: 0 }}>
            <div className="text-success fw-bold text-center" style={{ fontSize: '9px' }}>🟢 BID</div>
            {topBidWalls.slice(0, 1).map((wall, idx) => (
              <div key={`bid-${idx}`} className="mb-1 p-1" style={{ backgroundColor: '#f2fff2', border: '1px solid #e6ffe6', borderRadius: '2px', minWidth: 0, overflow: 'hidden' }}>
                <div className="d-flex justify-content-between" style={{ minWidth: 0 }}>
                  <span className="fw-bold" style={{ fontSize: '9px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>${fmt(wall.price, 1)}</span>
                  <span className="text-success" style={{ fontSize: '9px', flexShrink: 0 }}>${fmt(wall.total / 1000000, 1)}M</span>
                </div>
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: '7px', lineHeight: '1', minWidth: 0 }}>
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{secsToHMS(wall.lifeTime)}</span>
                  <span style={{ minWidth: 0, flexShrink: 0 }}>-{fmt(Math.abs(wall.distancePercent), 1)}%</span>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Компактная сводка */}
        <div className="text-muted text-center" style={{ fontSize: '7px', flexShrink: 0 }}>
          B:{walls.bidWalls?.length || 0} / A:{walls.askWalls?.length || 0}
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 border-end" style={{ 
      fontSize: '11px', 
      height: '100%', 
      overflow: 'hidden',
      wordWrap: 'break-word',
      width: '100%'
    }}>
      <div className="d-flex align-items-center mb-2 flex-wrap">
        <div className="badge bg-secondary me-1" style={{ fontSize: '8px' }}>#{index + 1}</div>
        <h6 className="mb-0 fw-bold" style={{ fontSize: '12px' }}>{symbol.replace('USDT', '')}</h6>
        <span className={`badge ${spot ? 'bg-success' : 'bg-warning'} ms-1`} style={{ fontSize: '7px' }}>
          {spot ? 'Спот' : 'Фьючерсы'}
        </span>
      </div>
      
      <div style={{ height: 'calc(100% - 40px)', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {renderOrderbookWalls()}
      </div>
    </div>
  );
}