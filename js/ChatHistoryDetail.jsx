import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

// --- Reusable UI shell components ---

const Card = ({ children, className = '' }) => (
  <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, icon: Icon }) => (
  <div className="p-4 border-b border-slate-700 flex items-center space-x-2">
    {Icon && <Icon className="w-5 h-5 text-cyan-400" />}
    <h2 className="text-lg font-semibold text-slate-100">{children}</h2>
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
);

const PersonaBadge = ({ persona }) => {
  const colors = {
    TacticalCoach: 'bg-blue-500/20 text-blue-300 border-blue-500',
    RecoveryCoach: 'bg-green-500/20 text-green-300 border-green-500',
    MentalResetAgent: 'bg-purple-500/20 text-purple-300 border-purple-500',
    OrchestrationCore: 'bg-slate-500/20 text-slate-300 border-slate-500',
    SystemFallback: 'bg-red-500/20 text-red-300 border-red-500',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colors[persona] || colors.OrchestrationCore}`}>
      {persona}
    </span>
  );
};

// --- Main Component ---

const ChatHistoryDetail = ({ item }) => {
  const [isOpen, setIsOpen] = useState(true);
  if (!item) return null;

  const { plan, final_cue_package: cue } = item;

  return (
    <Card>
      <CardHeader icon={MessageSquare}>Orchestration Details</CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Semantic Kernel Plan */}
          <div>
            <h3 className="font-semibold text-cyan-400 mb-1">Semantic Kernel Plan</h3>
            <p className="text-sm bg-slate-900 p-2 rounded-md font-mono">{plan}</p>
          </div>

          {/* Chat History */}
          <div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex justify-between items-center text-left font-semibold text-cyan-400 mb-1"
            >
              <span>AutoGen Chat History</span>
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isOpen && (
              <div className="space-y-3 mt-2 border-l-2 border-slate-700 pl-3 text-sm">
                {cue.chat_history.map((chat, index) => (
                  <div key={index}>
                    <PersonaBadge persona={chat.name} />
                    <p className="mt-1 text-slate-300 bg-slate-800/50 px-3 py-2 rounded">
                      {chat.content || 'No message content provided.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatHistoryDetail;
