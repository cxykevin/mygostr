import React from 'react';
import { AppConfig, Platform, RunMode, StrategyMode } from '../types';

interface ConfigPanelProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, setConfig }) => {
  
  const handleChange = (key: keyof AppConfig, value: any) => {
    // Restriction logic: Live Trading only supports MyQuant
    if (key === 'runMode' && value === RunMode.LIVE && config.platform !== Platform.MYQUANT) {
        alert("实盘交易目前仅支持掘金量化 (MyQuant)。将自动切换平台。");
        setConfig(prev => ({ ...prev, runMode: value, platform: Platform.MYQUANT }));
        return;
    }
    // Restriction logic: If switching from MyQuant while in Live, switch to Backtest
    if (key === 'platform' && value !== Platform.MYQUANT && config.runMode === RunMode.LIVE) {
        setConfig(prev => ({ ...prev, platform: value, runMode: RunMode.BACKTEST }));
        return;
    }

    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-full bg-[#f5f5f7] border-t border-mac-border px-6 py-4 flex items-center justify-between shrink-0 h-[70px]">
      
      <div className="flex items-center gap-8 w-full">
        {/* Brand/Status */}
        <div className="flex flex-col shrink-0">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">策略生成上下文</span>
          <div className="flex items-center gap-2 mt-0.5">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
             <span className="text-xs font-medium text-gray-600">配置参数</span>
          </div>
        </div>

        <div className="h-6 w-px bg-gray-300 mx-2"></div>

        {/* Strategy Mode Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-500 font-medium uppercase">策略模式</label>
          <select 
            value={config.strategyMode}
            onChange={(e) => handleChange('strategyMode', e.target.value as StrategyMode)}
            className="bg-transparent border-none text-gray-700 text-sm font-medium focus:ring-0 p-0 cursor-pointer hover:text-gray-900"
          >
            {Object.values(StrategyMode).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Platform Selector */}
        <div className="flex flex-col gap-1 ml-4">
          <label className="text-[10px] text-gray-500 font-medium uppercase">目标接口</label>
          <select 
            value={config.platform}
            onChange={(e) => handleChange('platform', e.target.value as Platform)}
            className="bg-transparent border-none text-gray-700 text-sm font-medium focus:ring-0 p-0 cursor-pointer hover:text-gray-900"
          >
            {Object.values(Platform).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-col gap-1 ml-4">
          <label className="text-[10px] text-gray-500 font-medium uppercase">运行模式</label>
          <select 
            value={config.runMode}
            onChange={(e) => handleChange('runMode', e.target.value as RunMode)}
            className="bg-transparent border-none text-gray-700 text-sm font-medium focus:ring-0 p-0 cursor-pointer hover:text-gray-900"
          >
            {Object.values(RunMode).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Capital */}
         <div className="flex flex-col gap-1 ml-4">
          <label className="text-[10px] text-gray-500 font-medium uppercase">回测资金 (CNY)</label>
          <input 
            type="number" 
            value={config.capital}
            onChange={(e) => handleChange('capital', parseInt(e.target.value))}
            className="bg-transparent border-none text-gray-700 text-sm font-mono font-medium focus:ring-0 p-0 w-28"
          />
        </div>

        <div className="ml-auto text-xs text-gray-400 italic">
          * 此配置仅用于 AI 生成代码时的上下文参考，不直接控制实盘。
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
