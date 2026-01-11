import React, { useEffect, useRef, memo } from 'react';

const TradingViewWidget: React.FC = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (container.current && container.current.childElementCount === 0) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = `
        {
          "autosize": true,
          "symbol": "SSE:000001",
          "interval": "D",
          "timezone": "Asia/Shanghai",
          "theme": "light",
          "style": "1",
          "locale": "zh_CN",
          "enable_publishing": false,
          "allow_symbol_change": true,
          "calendar": false,
          "support_host": "https://www.tradingview.com"
        }`;
      container.current.appendChild(script);
    }
  }, []);

  return (
    <div className="h-full w-full bg-white flex flex-col border-r border-mac-border/50">
      <div className="h-full w-full" ref={container} />
    </div>
  );
};

export default memo(TradingViewWidget);
