import React from 'react';
import { Link } from 'react-router-dom';

const Layout = ({ children, views, activeView, onViewChange }) => {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      {/* Progress Bar */}
      <div id="scroll-progress-bar" className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#00F5D4] via-[#0ea5e9] to-[#a855f7] z-50" />
      
      {/* Navigation */}
      <nav className="sticky top-0 left-0 right-0 bg-[#0d1117]/95 backdrop-blur-xl border-b border-[#303a3d]/30 p-3 z-30">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/assets/mini matchpoint logo.svg" alt="MatchPoint Systems" className="w-14 h-auto filter drop-shadow-glow" />
          </Link>
          <div className="nav-links hidden md:flex space-x-4 md:space-x-6">
            {views.map((view) => (
              <Link
                key={view.id}
                to={view.path}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  activeView === view.id
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold shadow-lg'
                    : 'text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50'
                }`}
                onClick={() => onViewChange(view.id)}
              >
                {view.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="pt-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
