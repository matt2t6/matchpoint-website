import React from 'react';

const HeaderTabs = () => {
  return (
    <header className="bg-slate-900 border-b border-cyan-600/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-cyan-400 glow-text">
                MatchPoint Systems
              </h1>
              <p className="text-slate-400 text-sm">
                AI Revolution in Sports
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1">
            <button className="px-4 py-2 text-cyan-400 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors glass-card">
              🏠 Dashboard
            </button>
            <button className="px-4 py-2 text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors glass-card">
              📊 Analytics
            </button>
            <button className="px-4 py-2 text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors glass-card">
              🔬 Validation
            </button>
            <button className="px-4 py-2 text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors glass-card">
              ⚙️ Settings
            </button>
          </nav>

          {/* Status Indicator */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm">System Online</span>
            </div>
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
              <span className="text-cyan-400 text-lg">👤</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderTabs; 