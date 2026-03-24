import React from 'react';
import { PlayCircle } from 'lucide-react';

const TimelineItem = ({ item, onSelect, isSelected }) => {
  const { session_id, timestamp, final_cue_package: cue } = item;
  const { persona, delivery_style, cue_text } = cue;

  return (
    <div
      className={`p-4 border-l-4 cursor-pointer transition-all duration-300 ${
        isSelected ? 'bg-slate-700/50 border-cyan-400' : 'border-slate-700 hover:bg-slate-800/80'
      }`}
      onClick={() => onSelect(item)}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <PlayCircle className={`w-6 h-6 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
          <div>
            <p className="font-semibold text-slate-100">{persona}</p>
            <p className="text-sm text-slate-400 truncate max-w-xs">{cue_text}</p>
          </div>
        </div>
        <div className="text-right space-y-1">
          <p className="text-xs text-slate-500">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <span className="mt-1 inline-block px-2 py-0.5 text-xs bg-slate-700 text-cyan-300 rounded-full">
            {delivery_style}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;
