import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const MarketTicker = () => {
  const tickerItems = [
    { symbol: 'S&P 500', value: '5,864.20', change: '+0.64%', up: true },
    { symbol: 'NASDAQ', value: '18,518.60', change: '+0.88%', up: true },
    { symbol: '10-YR TREASURY', value: '4.21%', change: '-0.03%', up: false },
    { symbol: 'BITCOIN', value: '$84,450', change: '+2.15%', up: true },
    { symbol: 'CRUDE OIL (WTI)', value: '$71.40', change: '-0.42%', up: false },
    { symbol: 'FED FUNDS RATE', value: '4.75% - 5.00%', change: 'PAUSE', neutral: true },
  ];

  return (
    <div className="w-full bg-neutral-900 text-neutral-300 text-xs border-b border-neutral-800 py-1.5 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono font-bold text-[11px] text-neutral-400 uppercase flex-shrink-0 pr-4 border-r border-neutral-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>US Markets</span>
        </div>

        <div className="flex items-center space-x-6 overflow-x-auto no-scrollbar whitespace-nowrap pl-4">
          {tickerItems.map((item, idx) => (
            <div key={idx} className="flex items-center space-x-1.5 font-mono text-[11px]">
              <span className="font-semibold text-neutral-200">{item.symbol}</span>
              <span className="text-neutral-400">{item.value}</span>
              {item.neutral ? (
                <span className="text-neutral-400 bg-neutral-800 px-1 rounded text-[10px]">{item.change}</span>
              ) : item.up ? (
                <span className="flex items-center text-emerald-400 text-[10px]">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  {item.change}
                </span>
              ) : (
                <span className="flex items-center text-rose-400 text-[10px]">
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                  {item.change}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
