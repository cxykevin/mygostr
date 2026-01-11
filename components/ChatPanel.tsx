import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onSummarize: () => void;
  onGenerateCode: () => void;
  onOpenExperienceModal: () => void;
  isLoading: boolean;
  hasSummary: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  messages, 
  onSendMessage, 
  onSummarize, 
  onGenerateCode, 
  onOpenExperienceModal,
  isLoading,
  hasSummary 
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white border-t border-mac-border/50">
      {/* Header */}
      <div className="px-4 py-2 bg-mac-gray/30 border-b border-mac-border/50 backdrop-blur-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
           <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI 投研助手</h3>
           <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded text-gray-600">Gemini Pro</span>
        </div>
        
        <button 
          onClick={onOpenExperienceModal}
          disabled={isLoading}
          className="text-[10px] font-medium text-mac-accent bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors flex items-center gap-1 border border-blue-100"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          录入经验
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center mt-10 text-gray-400 text-sm">
            <p>请描述您的交易思路。</p>
            <p className="text-xs mt-1">例如：“当5日均线上穿20日均线时买入，跌破60日均线止损。”</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-4 py-2.5 text-sm shadow-sm border ${
                msg.role === 'user'
                  ? 'bg-gray-800 text-white border-gray-800 rounded-sm rounded-tl-lg rounded-bl-lg rounded-br-none'
                  : 'bg-white text-gray-800 border-gray-200 rounded-sm rounded-tr-lg rounded-br-lg rounded-bl-none prose prose-sm max-w-none'
              }`}
            >
              {msg.role === 'user' ? (
                msg.text
              ) : (
                <ReactMarkdown
                  components={{
                    code({node, inline, className, children, ...props}: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ margin: '0.5em 0', borderRadius: '4px', fontSize: '0.85em' }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-sm text-xs text-gray-500 animate-pulse">
              思考中...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-mac-border/50">
        <div className="relative flex items-end gap-2">
          <textarea
            className="w-full bg-gray-50 border border-mac-border focus:border-gray-400 focus:ring-0 focus:bg-white transition-all rounded-sm p-3 text-sm resize-none outline-none text-gray-800 placeholder-gray-400"
            rows={2}
            placeholder="探讨策略思路..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <div className="flex gap-2">
             <button
              onClick={onSummarize}
              disabled={isLoading || messages.length < 2}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-sm shadow-sm transition-all disabled:opacity-50 flex items-center gap-1"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
               提炼策略逻辑
             </button>
             {hasSummary && (
               <button
                onClick={onGenerateCode}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium text-white bg-mac-accent hover:bg-blue-700 border border-transparent rounded-sm shadow-sm transition-all disabled:opacity-50 flex items-center gap-1"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                 生成代码
               </button>
             )}
          </div>
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-black border border-gray-900 rounded-sm transition-colors disabled:opacity-50"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;