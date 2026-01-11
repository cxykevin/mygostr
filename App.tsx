import React, { useState, useEffect } from 'react';
import TradingViewWidget from './components/TradingViewWidget';
import IDE from './components/IDE';
import ChatPanel from './components/ChatPanel';
import ConfigPanel from './components/ConfigPanel';
import ExperienceModal from './components/ExperienceModal';
import SessionList from './components/SessionList';
import { AppConfig, Platform, RunMode, StrategyMode, Message, StrategySession } from './types';
import { generateStrategy, chatWithAI, summarizeStrategy, extractRulesFromText } from './services/geminiService';

const App: React.FC = () => {
  // --- State ---
  const [config, setConfig] = useState<AppConfig>({
    platform: Platform.MYQUANT,
    runMode: RunMode.BACKTEST,
    strategyMode: StrategyMode.TRADITIONAL,
    capital: 1000000,
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    frequency: '1d'
  });

  // History / Session Management
  const [sessions, setSessions] = useState<StrategySession[]>([{
    id: 'default',
    name: '新策略 1',
    messages: [{
      role: 'model',
      text: "欢迎使用 MyGO Street。我是您的智能投研助手。您可以直接与我对话，或者点击右上方的“录入经验”将您的投资心得转化为策略。",
      timestamp: new Date()
    }],
    strategyLogic: "",
    generatedCode: "",
    lastModified: Date.now()
  }]);
  const [activeSessionId, setActiveSessionId] = useState<string>('default');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [isAnalyzingExperience, setIsAnalyzingExperience] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Computed Properties based on Active Session
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  
  // --- Helpers for updating session state ---
  const updateActiveSession = (updates: Partial<StrategySession>) => {
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId 
        ? { ...s, ...updates, lastModified: Date.now() } 
        : s
    ));
  };

  const handleNewSession = () => {
    const newId = Date.now().toString();
    const newSession: StrategySession = {
      id: newId,
      name: `新策略 ${sessions.length + 1}`,
      messages: [{
        role: 'model',
        text: "欢迎使用 MyGO Street。请告诉我您的新想法。",
        timestamp: new Date()
      }],
      strategyLogic: "",
      generatedCode: "",
      lastModified: Date.now()
    };
    setSessions(prev => [newSession, ...prev]); // Prepend
    setActiveSessionId(newId);
    // Auto exit fullscreen on new session if desired, but let's keep user context
  };

  // --- Handlers ---

  const handleSendMessage = async (text: string) => {
    const newUserMsg: Message = { role: 'user', text, timestamp: new Date() };
    const newHistory = [...activeSession.messages, newUserMsg];
    
    // Optimistic Update
    updateActiveSession({ messages: newHistory });
    setIsLoading(true);

    const responseText = await chatWithAI(newHistory, text);
    
    updateActiveSession({ 
      messages: [...newHistory, { role: 'model', text: responseText, timestamp: new Date() }] 
    });
    setIsLoading(false);
  };

  const handleSummarize = async () => {
    setIsLoading(true);
    const summary = await summarizeStrategy(activeSession.messages);
    
    updateActiveSession({ 
      strategyLogic: summary,
      messages: [...activeSession.messages, { role: 'model', text: "策略逻辑已提炼完成，请查看上方面板。", timestamp: new Date() }]
    });
    setIsLoading(false);
  };

  const handleGenerateCode = async () => {
    if (!activeSession.strategyLogic) return;
    setIsLoading(true);
    
    const code = await generateStrategy(activeSession.strategyLogic, { 
      platform: config.platform,
      strategyMode: config.strategyMode
    });
    
    updateActiveSession({
      generatedCode: code,
      messages: [...activeSession.messages, { role: 'model', text: "策略代码已生成。", timestamp: new Date() }]
    });
    setIsLoading(false);
  };

  const handleExperienceSubmit = async (name: string, content: string) => {
    setIsAnalyzingExperience(true);
    const rules = await extractRulesFromText(name, content);
    
    updateActiveSession({
      name: name || activeSession.name, // Update name if provided
      strategyLogic: rules,
      messages: [...activeSession.messages, {
        role: 'model',
        text: `已根据您的经验描述提取了规则。`,
        timestamp: new Date()
      }]
    });

    setIsAnalyzingExperience(false);
    setIsExperienceModalOpen(false);
  };

  const handleToolAction = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f5f5f7]">
      {/* Top Navbar */}
      <header className="h-12 bg-white/80 backdrop-blur-md border-b border-mac-border/60 flex items-center px-6 shrink-0 z-20 sticky top-0 justify-between">
        <div className="flex items-center gap-2">
           <svg className="w-5 h-5 text-gray-800" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
           <span className="font-semibold text-gray-900 tracking-tight text-sm">MyGO Street</span>
        </div>
        
        {/* Central Session Display (Optional styling) */}
        <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
           <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{activeSession.name}</span>
        </div>

        <div className="flex items-center gap-4">
           <a 
              href="https://qm.qq.com/q/2N5DGNP350" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              加入 QQ 群
            </a>
            <div className="text-xs text-gray-400 font-medium">
              v1.3.0
            </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: TradingView (Hidden in Fullscreen) */}
        <div className={`h-full flex flex-col relative z-0 transition-all duration-300 ease-in-out ${isFullScreen ? 'w-0 opacity-0 overflow-hidden' : 'w-[55%] opacity-100'}`}>
          <TradingViewWidget />
        </div>

        {/* Right Column: IDE & Chat */}
        <div className={`h-full flex flex-col bg-white border-l border-mac-border z-10 shadow-lg transition-all duration-300 ease-in-out ${isFullScreen ? 'w-full' : 'w-[45%]'}`}>
          
          <div className="flex-1 flex overflow-hidden">
             {/* Inner Sidebar: Session List */}
             {/* Only show session list if NOT full screen, OR if full screen but wide enough? 
                 Let's keep it simple: always show unless user hides it. 
                 Actually, fitting a sidebar inside the 45% view might be tight.
                 Let's put the Session List OUTSIDE the flex of the main view?
                 No, let's put it as a sidebar within the "Right Column" block.
             */}
             <SessionList 
               sessions={sessions}
               activeSessionId={activeSessionId}
               onSelectSession={setActiveSessionId}
               onNewSession={handleNewSession}
             />

             {/* The actual IDE + Chat Content */}
             <div className="flex-1 flex flex-col min-w-0 border-l border-mac-border">
                {/* Top Half: Code IDE / Strategy Logic */}
                <div className="h-[65%] flex flex-col">
                  <IDE 
                    code={activeSession.generatedCode} 
                    strategyLogic={activeSession.strategyLogic}
                    isGenerating={isLoading} 
                    isFullScreen={isFullScreen}
                    onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
                    strategyMode={config.strategyMode}
                    onToolAction={handleToolAction}
                  />
                </div>
                
                {/* Bottom Half: Chat */}
                <div className="h-[35%] flex flex-col">
                  <ChatPanel 
                    messages={activeSession.messages} 
                    onSendMessage={handleSendMessage} 
                    onSummarize={handleSummarize}
                    onGenerateCode={handleGenerateCode}
                    onOpenExperienceModal={() => setIsExperienceModalOpen(true)}
                    isLoading={isLoading}
                    hasSummary={!!activeSession.strategyLogic}
                  />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Config Panel */}
      <ConfigPanel config={config} setConfig={setConfig} />

      {/* Modals */}
      <ExperienceModal 
        isOpen={isExperienceModalOpen}
        onClose={() => setIsExperienceModalOpen(false)}
        onSubmit={handleExperienceSubmit}
        isAnalyzing={isAnalyzingExperience}
      />
    </div>
  );
};

export default App;