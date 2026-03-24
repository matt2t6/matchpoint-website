// AnalyticsDashboard.jsx - MatchPoint x Babcock Ranch Solar Optimization System

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
  ScatterChart, Scatter, CartesianGrid
} from 'recharts';
import { 
  BrainCircuit, SlidersHorizontal, TrendingUp, ChevronUp, ChevronDown,
  Sun, Wind, Battery, Zap, Target, Gauge, Activity, AlertTriangle,
  Settings, BarChart3, Thermometer, Droplets, Eye
} from 'lucide-react';

const Card = ({ children, className = '' }) => (
  <div className={`bg-slate-800 rounded-lg border border-slate-700 shadow-lg ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, icon: Icon, subtitle }) => (
  <div className="flex items-center justify-between p-4 border-b border-slate-700">
    <div className="flex items-center gap-2">
      <Icon className="w-5 h-5 text-cyan-400" />
      <div>
        <h3 className="font-semibold text-slate-200">{children}</h3>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
);

// Fibonacci Phase-Staggering Cluster Component
const FPSCluster = ({ clusterId, geometry, status, performance }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const microAzimuths = geometry?.microAzimuths || [-2, 0, 2, -2, 2];
  const clusterSize = 5;
  
  return (
    <Card className="hover:border-cyan-500/50 transition-colors">
      <CardHeader icon={Target} subtitle={`Cluster ${clusterId} - FPS Geometry`}>
        <div className="flex items-center gap-2">
          <span>FPS Cluster {clusterId}</span>
          <div className={`w-2 h-2 rounded-full ${
            status === 'optimal' ? 'bg-green-400' : 
            status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
          }`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {Array.from({ length: clusterSize }).map((_, i) => (
            <div key={i} className="relative">
              <div className={`w-full h-8 rounded border ${
                microAzimuths[i] > 0 ? 'bg-cyan-500/20 border-cyan-500/50' :
                microAzimuths[i] < 0 ? 'bg-purple-500/20 border-purple-500/50' :
                'bg-slate-700 border-slate-600'
              }`}>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-mono">
                  {microAzimuths[i]}°
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Performance:</span>
          <span className="font-semibold text-cyan-400">{performance?.efficiency || 0}%</span>
        </div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-2 flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-cyan-400"
        >
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {isExpanded ? 'Collapse' : 'Expand'} Details
        </button>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Shadow Reduction:</span>
              <span className="text-green-400">+{performance?.shadowReduction || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span>Diffuse Capture:</span>
              <span className="text-blue-400">+{performance?.diffuseCapture || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span>Wind Sync:</span>
              <span className="text-purple-400">{performance?.windSync || 0}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Storage Orchestration Component
const StorageOrchestration = ({ storageData }) => {
  const [activeMode, setActiveMode] = useState('clipping');
  
  const modes = [
    { id: 'clipping', name: 'Clipping Soak', icon: Zap, color: 'cyan' },
    { id: 'peak', name: 'Peak Shift', icon: TrendingUp, color: 'green' },
    { id: 'feeder', name: 'Feeder Relief', icon: Activity, color: 'yellow' },
    { id: 'storm', name: 'Storm Posture', icon: AlertTriangle, color: 'red' }
  ];
  
  return (
    <Card>
      <CardHeader icon={Battery} subtitle="Intelligent Dispatch Optimization">
        Storage Orchestration
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeMode === mode.id
                  ? `bg-${mode.color}-500 text-white`
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <mode.icon className="w-3 h-3 inline mr-1" />
              {mode.name}
            </button>
          ))}
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">SoC Level:</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                  style={{ width: `${storageData?.soc || 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-cyan-400">{storageData?.soc || 0}%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Power Output:</span>
              <div className="font-semibold text-green-400">{storageData?.powerOutput || 0} MW</div>
            </div>
            <div>
              <span className="text-slate-400">Energy Stored:</span>
              <div className="font-semibold text-blue-400">{storageData?.energyStored || 0} MWh</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Weather Integration Component
const WeatherIntegration = ({ weatherData }) => {
  return (
    <Card>
      <CardHeader icon={Sun} subtitle="Real-time Environmental Data">
        Weather Integration
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-yellow-400" />
            <div>
              <div className="text-sm text-slate-400">POA Irradiance</div>
              <div className="font-semibold text-yellow-400">{weatherData?.poa || 0} W/m²</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-sm text-slate-400">Wind Speed</div>
              <div className="font-semibold text-blue-400">{weatherData?.windSpeed || 0} m/s</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-red-400" />
            <div>
              <div className="text-sm text-slate-400">Temperature</div>
              <div className="font-semibold text-red-400">{weatherData?.temperature || 0}°C</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-sm text-slate-400">Humidity</div>
              <div className="font-semibold text-cyan-400">{weatherData?.humidity || 0}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Performance Metrics Component
const PerformanceMetrics = ({ metrics }) => {
  const performanceData = useMemo(() => {
    return [
      { name: 'Energy Uplift', value: metrics?.energyUplift || 0, target: 5, unit: '%', color: 'cyan' },
      { name: 'Clipping Recovery', value: metrics?.clippingRecovery || 0, target: 40, unit: '%', color: 'green' },
      { name: 'Mechanical Stress', value: metrics?.mechanicalStress || 0, target: 0, unit: 'cycles', color: 'yellow' },
      { name: 'Curtailment Avoided', value: metrics?.curtailmentAvoided || 0, target: 100, unit: 'MWh', color: 'purple' }
    ];
  }, [metrics]);

  return (
    <Card>
      <CardHeader icon={BarChart3} subtitle="Key Performance Indicators">
        Performance Metrics
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {performanceData.map((metric) => (
            <div key={metric.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">{metric.name}</span>
                <span className="text-sm font-semibold text-cyan-400">
                  {metric.value}{metric.unit}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r from-${metric.color}-500 to-${metric.color}-400`}
                  style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Analytics Dashboard
const AnalyticsDashboard = ({ data }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [activeView, setActiveView] = useState('overview');

  // Mock data for demonstration - replace with real data integration
  const mockData = {
    clusters: Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      geometry: {
        microAzimuths: [-2, 0, 2, -2, 2]
      },
      status: ['optimal', 'warning', 'optimal', 'optimal', 'warning', 'optimal', 'optimal', 'optimal'][i],
      performance: {
        efficiency: 85 + Math.random() * 15,
        shadowReduction: 15 + Math.random() * 10,
        diffuseCapture: 8 + Math.random() * 7,
        windSync: 75 + Math.random() * 20
      }
    })),
    storage: {
      soc: 65,
      powerOutput: 12.5,
      energyStored: 45.2
    },
    weather: {
      poa: 850,
      windSpeed: 3.2,
      temperature: 28.5,
      humidity: 65
    },
    metrics: {
      energyUplift: 3.2,
      clippingRecovery: 25.8,
      mechanicalStress: -12,
      curtailmentAvoided: 45.6
    }
  };

  const timeframes = [
    { id: '1h', name: '1 Hour' },
    { id: '24h', name: '24 Hours' },
    { id: '7d', name: '7 Days' },
    { id: '30d', name: '30 Days' }
  ];

  const views = [
    { id: 'overview', name: 'Overview', icon: Eye },
    { id: 'clusters', name: 'FPS Clusters', icon: Target },
    { id: 'storage', name: 'Storage', icon: Battery },
    { id: 'weather', name: 'Weather', icon: Sun }
  ];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-cyan-400">MatchPoint Solar Orchestrator</h2>
          <p className="text-slate-400">Babcock Ranch - Fibonacci Phase-Staggering Control System</p>
        </div>
        
        <div className="flex gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setSelectedTimeframe(tf.id)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                selectedTimeframe === tf.id
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {tf.name}
            </button>
          ))}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === view.id
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <view.icon className="w-4 h-4" />
            {view.name}
          </button>
        ))}
      </div>

      {/* Main Content */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <PerformanceMetrics metrics={mockData.metrics} />
          <StorageOrchestration storageData={mockData.storage} />
          <WeatherIntegration weatherData={mockData.weather} />
        </div>
      )}

      {activeView === 'clusters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockData.clusters.map((cluster) => (
            <FPSCluster key={cluster.id} {...cluster} />
          ))}
        </div>
      )}

      {activeView === 'storage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StorageOrchestration storageData={mockData.storage} />
          <Card>
            <CardHeader icon={Activity} subtitle="Storage Dispatch History">
              Dispatch Timeline
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}} />
                  <Area type="monotone" dataKey="power" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'weather' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeatherIntegration weatherData={mockData.weather} />
          <Card>
            <CardHeader icon={TrendingUp} subtitle="Environmental Trends">
              Weather Patterns
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}} />
                  <Line type="monotone" dataKey="irradiance" stroke="#facc15" strokeWidth={2} />
                  <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;