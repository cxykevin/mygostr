import React, { useState } from 'react';

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, content: string) => void;
  isAnalyzing: boolean;
}

const ASSET_OPTIONS = ['股票 (Stock)', '指数 (Index)', 'ETF', '可转债 (Bond)', '期货 (Futures)'];
const STYLE_OPTIONS = ['趋势跟踪 (Trend)', '均值回归 (Reversion)', '突破策略 (Breakout)', '事件驱动 (Event)', '多因子 (Multi-factor)'];

const ExperienceModal: React.FC<ExperienceModalProps> = ({ isOpen, onClose, onSubmit, isAnalyzing }) => {
  const [name, setName] = useState('');
  
  // Structured Inputs
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  
  const [entryLogic, setEntryLogic] = useState('');
  const [exitLogic, setExitLogic] = useState('');
  const [riskLogic, setRiskLogic] = useState('');

  if (!isOpen) return null;

  const toggleAsset = (asset: string) => {
    if (selectedAssets.includes(asset)) {
      setSelectedAssets(selectedAssets.filter(a => a !== asset));
    } else {
      setSelectedAssets([...selectedAssets, asset]);
    }
  };

  const handleSubmit = () => {
    // Combine structured data into a formatted string for the AI
    const structuredContent = `
【基本配置】
- 交易标的: ${selectedAssets.join(', ') || '未指定'}
- 策略风格: ${selectedStyle || '未指定'}

【核心逻辑】
1. 入场条件 (Entry): ${entryLogic}
2. 出场条件 (Exit): ${exitLogic}
3. 资金与风控 (Risk): ${riskLogic}
    `.trim();

    onSubmit(name, structuredContent);
  };

  const isFormValid = name.trim() && (entryLogic.trim() || exitLogic.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
        onClick={!isAnalyzing ? onClose : undefined}
      ></div>

      <div className="relative bg-white rounded-xl shadow-2xl w-[700px] max-w-[95vw] h-[85vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-sm font-bold text-gray-800">策略经验录入</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">请回答以下问题，AI 将为您提炼量化规则</p>
          </div>
          {!isAnalyzing && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">策略名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="给您的策略起个名字（例如：双均线突破 v1）"
                className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all placeholder-gray-400 font-medium"
                disabled={isAnalyzing}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">交易标的 (多选)</label>
                  <div className="flex flex-wrap gap-2">
                    {ASSET_OPTIONS.map(asset => (
                      <button
                        key={asset}
                        onClick={() => toggleAsset(asset)}
                        disabled={isAnalyzing}
                        className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-all ${
                          selectedAssets.includes(asset)
                            ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {asset}
                      </button>
                    ))}
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">策略风格 (单选)</label>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_OPTIONS.map(style => (
                      <button
                        key={style}
                        onClick={() => setSelectedStyle(style)}
                        disabled={isAnalyzing}
                        className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-all ${
                          selectedStyle === style
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full"></div>

          {/* Section 2: Detailed Logic */}
          <div className="space-y-6">
            
            {/* Entry */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">1</div>
                <label className="text-sm font-semibold text-gray-800">入场信号 (Entry Signal)</label>
              </div>
              <p className="text-xs text-gray-500 mb-2 pl-7">什么样的市场情况会触发您的买入？（技术指标、价格形态、基本面数据等）</p>
              <textarea
                value={entryLogic}
                onChange={(e) => setEntryLogic(e.target.value)}
                placeholder="例如：当收盘价站上20日均线，且MACD出现金叉时买入..."
                rows={3}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all resize-none placeholder-gray-300 leading-relaxed"
                disabled={isAnalyzing}
              />
            </div>

            {/* Exit */}
            <div>
               <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">2</div>
                <label className="text-sm font-semibold text-gray-800">出场信号 (Exit Signal)</label>
              </div>
              <p className="text-xs text-gray-500 mb-2 pl-7">什么样的条件会触发卖出？包含止盈和止损规则。</p>
              <textarea
                value={exitLogic}
                onChange={(e) => setExitLogic(e.target.value)}
                placeholder="例如：盈利超过10%后回撤2%止盈；或者亏损达到5%时强制止损..."
                rows={3}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none placeholder-gray-300 leading-relaxed"
                disabled={isAnalyzing}
              />
            </div>

            {/* Risk */}
            <div>
               <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">3</div>
                <label className="text-sm font-semibold text-gray-800">资金与风控 (Money Management)</label>
              </div>
              <p className="text-xs text-gray-500 mb-2 pl-7">您如何控制仓位？有什么特殊的风险控制手段？</p>
              <textarea
                value={riskLogic}
                onChange={(e) => setRiskLogic(e.target.value)}
                placeholder="例如：每次交易使用总资金的20%；大盘指数跌破年线时空仓..."
                rows={2}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none placeholder-gray-300 leading-relaxed"
                disabled={isAnalyzing}
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
          <div className="text-xs text-gray-400">
             {selectedAssets.length > 0 ? `已选: ${selectedAssets.join(', ')}` : ''}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isAnalyzing}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isAnalyzing}
              className="px-6 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-black rounded-md shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  智能分析中...
                </>
              ) : (
                '提炼规则'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienceModal;
