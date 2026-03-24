// MVSystem.jsx - MatchPoint x Babcock Ranch Measurement & Verification System

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, CartesianGrid, BarChart, Bar, ScatterChart, Scatter
} from 'recharts';
import { 
  BrainCircuit, SlidersHorizontal, TrendingUp, ChevronUp, ChevronDown,
  Sun, Wind, Battery, Zap, Target, Gauge, Activity, AlertTriangle,
  Settings, BarChart3, Thermometer, Droplets, Eye, Cpu, Shield,
  RotateCcw, Play, Pause, Square, CheckCircle, XCircle, Clock, FileText
} from 'lucide-react';

const Card = ({ children, className = '' }) => (
  <div className={`bg-slate-800 rounded-lg border border-slate-700 shadow-lg ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, icon: Icon, subtitle, status }) => (
  <div className="flex items-center justify-between p-4 border-b border-slate-700">
    <div className="flex items-center gap-2">
      <Icon className="w-5 h-5 text-cyan-400" />
      <div>
        <h3 className="font-semibold text-slate-200">{children}</h3>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
    {status && (
      <div className={`px-2 py-1 rounded text-xs font-medium ${
        status === 'active' ? 'bg-green-500/20 text-green-400' :
        status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
        status === 'error' ? 'bg-red-500/20 text-red-400' :
        'bg-slate-500/20 text-slate-400'
      }`}>
        {status}
      </div>
    )}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
);

// A/B Testing Component
const ABTesting = ({ testData }) => {
  const [selectedMetric, setSelectedMetric] = useState('energy');
  
  const metrics = [
    { id: 'energy', name: 'Energy Production', unit: 'MWh', color: 'cyan' },
    { id: 'efficiency', name: 'System Efficiency', unit: '%', color: 'green' },
    { id: 'clipping', name: 'Clipping Recovery', unit: '%', color: 'yellow' },
    { id: 'curtailment', name: 'Curtailment Avoided', unit: 'MWh', color: 'purple' }
  ];
  
  return (
    <Card>
      <CardHeader icon={Target} subtitle="A/B Testing - 60-90 Day Protocol" status="active">
        A/B Testing
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          {metrics.map((metric) => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                selectedMetric === metric.id
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {metric.name}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-700/50 p-3 rounded">
            <div className="text-sm font-medium text-slate-200 mb-2">Control (A)</div>
            <div className="text-2xl font-bold text-slate-300">
              {testData?.control?.[selectedMetric] || 0}
              <span className="text-sm text-slate-400 ml-1">
                {metrics.find(m => m.id === selectedMetric)?.unit}
              </span>
            </div>
          </div>
          <div className="bg-cyan-500/20 p-3 rounded border border-cyan-500/50">
            <div className="text-sm font-medium text-cyan-400 mb-2">Treatment (B)</div>
            <div className="text-2xl font-bold text-cyan-400">
              {testData?.treatment?.[selectedMetric] || 0}
              <span className="text-sm text-cyan-300 ml-1">
                {metrics.find(m => m.id === selectedMetric)?.unit}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900 p-3 rounded text-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400">Uplift:</span>
            <span className="font-semibold text-green-400">
              +{testData?.uplift?.[selectedMetric] || 0}%
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400">Confidence Level:</span>
            <span className="font-semibold text-blue-400">
              {testData?.confidence?.[selectedMetric] || 0}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Statistical Significance:</span>
            <span className={`font-semibold ${
              testData?.significance?.[selectedMetric] ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {testData?.significance?.[selectedMetric] ? 'Significant' : 'Insufficient'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// KPI Dashboard Component
const KPIDashboard = ({ kpiData }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  
  const timeframes = [
    { id: '1d', name: '1 Day' },
    { id: '7d', name: '7 Days' },
    { id: '30d', name: '30 Days' },
    { id: '90d', name: '90 Days' }
  ];
  
  const kpis = [
    { 
      name: 'Total Energy', 
      value: kpiData?.totalEnergy || 0, 
      unit: 'MWh', 
      target: 1000,
      color: 'cyan' 
    },
    { 
      name: 'Banded Energy (7-9am)', 
      value: kpiData?.bandedEnergy?.morning || 0, 
      unit: 'MWh', 
      target: 150,
      color: 'yellow' 
    },
    { 
      name: 'Banded Energy (3-6pm)', 
      value: kpiData?.bandedEnergy?.afternoon || 0, 
      unit: 'MWh', 
      target: 200,
      color: 'orange' 
    },
    { 
      name: 'Clipping Recovery', 
      value: kpiData?.clippingRecovery || 0, 
      unit: 'MWh', 
      target: 50,
      color: 'green' 
    },
    { 
      name: 'Curtailment Avoided', 
      value: kpiData?.curtailmentAvoided || 0, 
      unit: 'MWh', 
      target: 100,
      color: 'purple' 
    },
    { 
      name: 'Mechanical Cycles', 
      value: kpiData?.mechanicalCycles || 0, 
      unit: 'cycles', 
      target: 1200,
      color: 'red' 
    }
  ];
  
  return (
    <Card>
      <CardHeader icon={BarChart3} subtitle="Key Performance Indicators">
        KPI Dashboard
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          {timeframes.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setSelectedTimeframe(tf.id)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                selectedTimeframe === tf.id
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {tf.name}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.name} className="bg-slate-700/50 p-3 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">{kpi.name}</span>
                <span className="text-sm font-semibold text-cyan-400">
                  {kpi.value}{kpi.unit}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r from-${kpi.color}-500 to-${kpi.color}-400`}
                  style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Statistical Analysis Component
const StatisticalAnalysis = ({ statsData }) => {
  const [selectedAnalysis, setSelectedAnalysis] = useState('correlation');
  
  const analyses = [
    { id: 'correlation', name: 'Correlation Analysis', description: 'Irradiance vs Performance' },
    { id: 'regression', name: 'Regression Analysis', description: 'Multi-variable modeling' },
    { id: 'anova', name: 'ANOVA', description: 'Variance analysis' },
    { id: 'trend', name: 'Trend Analysis', description: 'Time series analysis' }
  ];
  
  return (
    <Card>
      <CardHeader icon={BrainCircuit} subtitle="Statistical Analysis & Modeling">
        Statistical Analysis
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          {analyses.map((analysis) => (
            <button
              key={analysis.id}
              onClick={() => setSelectedAnalysis(analysis.id)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                selectedAnalysis === analysis.id
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {analysis.name}
            </button>
          ))}
        </div>
        
        <div className="bg-slate-900 p-3 rounded text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">R-squared:</span>
            <span className="font-semibold text-cyan-400">{statsData?.rSquared || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">P-value:</span>
            <span className="font-semibold text-blue-400">{statsData?.pValue || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Standard Error:</span>
            <span className="font-semibold text-yellow-400">{statsData?.standardError || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Confidence Interval:</span>
            <span className="font-semibold text-green-400">{statsData?.confidenceInterval || '0-0'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Acceptance Criteria Component
const AcceptanceCriteria = ({ criteriaData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const criteria = [
    { 
      name: 'Energy Uplift', 
      target: '≥2-3%', 
      current: criteriaData?.energyUplift || 0,
      status: criteriaData?.energyUplift >= 2 ? 'passed' : 'failed',
      description: 'Net energy uplift with non-degraded wear metrics'
    },
    { 
      name: 'Wear Metrics', 
      target: 'Neutral or Reduced', 
      current: criteriaData?.wearMetrics || 'Neutral',
      status: criteriaData?.wearMetrics === 'Neutral' || criteriaData?.wearMetrics === 'Reduced' ? 'passed' : 'failed',
      description: 'Mechanical stress neutral or reduced'
    },
    { 
      name: 'Safety Events', 
      target: '0', 
      current: criteriaData?.safetyEvents || 0,
      status: criteriaData?.safetyEvents === 0 ? 'passed' : 'failed',
      description: 'No safety events during pilot'
    },
    { 
      name: 'System Availability', 
      target: '≥99.5%', 
      current: criteriaData?.systemAvailability || 0,
      status: criteriaData?.systemAvailability >= 99.5 ? 'passed' : 'failed',
      description: 'System availability during pilot period'
    }
  ];
  
  return (
    <Card>
      <CardHeader icon={CheckCircle} subtitle="Pilot Acceptance Criteria" status="active">
        Acceptance Criteria
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {criteria.map((criterion) => (
            <div key={criterion.name} className="flex items-center justify-between p-3 bg-slate-700/50 rounded">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200">{criterion.name}</span>
                  {criterion.status === 'passed' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="text-xs text-slate-400">{criterion.description}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-cyan-400">{criterion.current}</div>
                <div className="text-xs text-slate-400">Target: {criterion.target}</div>
              </div>
            </div>
          ))}
        </div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-4 flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-cyan-400"
        >
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {isExpanded ? 'Collapse' : 'Expand'} Detailed Criteria
        </button>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-700 space-y-2 text-xs">
            <div className="bg-slate-900 p-2 rounded">
              <div>Statistical Power: ≥80%</div>
              <div>Sample Size: 60-90 days</div>
              <div>Normalization: Per-kWp, irradiance/temperature-matched</div>
              <div>Wind Class Bins: 3-5 m/s, 5-8 m/s, 8+ m/s</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main M&V System Component
const MVSystem = () => {
  const [selectedPhase, setSelectedPhase] = useState('baseline');
  
  // Mock data for demonstration
  const mockData = {
    test: {
      control: {
        energy: 1250,
        efficiency: 85.2,
        clipping: 12.5,
        curtailment: 45.8
      },
      treatment: {
        energy: 1285,
        efficiency: 87.8,
        clipping: 8.2,
        curtailment: 12.3
      },
      uplift: {
        energy: 2.8,
        efficiency: 3.1,
        clipping: 34.4,
        curtailment: 73.1
      },
      confidence: {
        energy: 95.2,
        efficiency: 92.8,
        clipping: 88.5,
        curtailment: 91.3
      },
      significance: {
        energy: true,
        efficiency: true,
        clipping: true,
        curtailment: true
      }
    },
    kpi: {
      totalEnergy: 1285,
      bandedEnergy: {
        morning: 145,
        afternoon: 210
      },
      clippingRecovery: 42.3,
      curtailmentAvoided: 33.5,
      mechanicalCycles: 1150
    },
    stats: {
      rSquared: 0.892,
      pValue: 0.023,
      standardError: 0.045,
      confidenceInterval: '2.1-3.5'
    },
    criteria: {
      energyUplift: 2.8,
      wearMetrics: 'Neutral',
      safetyEvents: 0,
      systemAvailability: 99.7
    }
  };
  
  const phases = [
    { id: 'baseline', name: 'Baseline', description: 'Week 1-3' },
    { id: 'overlay', name: 'Overlay', description: 'Week 3-8' },
    { id: 'ab', name: 'A/B M&V', description: 'Week 8-14' },
    { id: 'scale', name: 'Scale', description: 'Week 14-24' }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-cyan-400">Measurement & Verification</h2>
          <p className="text-slate-400">MatchPoint x Babcock Ranch - Rigorous Testing Protocol</p>
        </div>
        
        <div className="flex gap-2">
          {phases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setSelectedPhase(phase.id)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                selectedPhase === phase.id
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {phase.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* M&V System Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ABTesting testData={mockData.test} />
        <KPIDashboard kpiData={mockData.kpi} />
        <StatisticalAnalysis statsData={mockData.stats} />
        <AcceptanceCriteria criteriaData={mockData.criteria} />
      </div>
      
      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader icon={TrendingUp} subtitle="Performance Comparison">
            A/B Performance Over Time
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}} />
                <Line type="monotone" dataKey="control" stroke="#94a3b8" strokeWidth={2} />
                <Line type="monotone" dataKey="treatment" stroke="#22d3ee" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader icon={BarChart3} subtitle="Statistical Distribution">
            Performance Distribution
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="category" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}} />
                <Bar dataKey="control" fill="#94a3b8" />
                <Bar dataKey="treatment" fill="#22d3ee" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MVSystem; 