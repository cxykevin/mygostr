import React from 'react';
import { StrategySession } from '../types';

interface SessionListProps {
  sessions: StrategySession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
}

const SessionList: React.FC<SessionListProps> = ({ 
  sessions, 
  activeSessionId, 
  onSelectSession, 
  onNewSession 
}) => {
  return (
    <div className="h-full w-56 bg-[#f0f0f2] border-r border-mac-border flex flex-col shrink-0">
      <div className="h-10 px-3 flex items-center justify-between border-b border-mac-border/50 shrink-0">
        <span className="text-xs font-semibold text-gray-500">历史策略</span>
        <button 
          onClick={onNewSession}
          className="p-1 hover:bg-white rounded transition-colors text-gray-600"
          title="新建策略"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessions.map(session => (
          <div 
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`px-4 py-3 cursor-pointer border-b border-gray-200/50 hover:bg-white/50 transition-colors ${
              session.id === activeSessionId ? 'bg-white border-l-4 border-l-mac-accent' : 'border-l-4 border-l-transparent'
            }`}
          >
            <div className="text-sm font-medium text-gray-800 truncate">
              {session.name || '未命名策略'}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-500 truncate max-w-[80px]">
                {session.strategyLogic ? '已生成逻辑' : '草稿'}
              </span>
              <span className="text-[10px] text-gray-400">
                {new Date(session.lastModified).toLocaleDateString([], {month:'numeric', day:'numeric'})}
              </span>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
           <div className="p-4 text-center text-xs text-gray-400 mt-4">
             暂无策略记录
           </div>
        )}
      </div>
    </div>
  );
};

export default SessionList;
