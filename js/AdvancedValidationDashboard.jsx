import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE_URL = 'http://127.0.0.1:5000/api';

export default function AdvancedValidationDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [validationData, setValidationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiStatus, setApiStatus] = useState('unknown');

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      setApiStatus(data.status);
    } catch (err) {
      setApiStatus('unavailable');
      console.error('API health check failed:', err);
    }
  };

  const runValidation = async (validationType, config = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/validation/${validationType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      
      if (data.success) {
        setValidationData(prev => ({
          ...prev,
          [validationType]: data.results
        }));
        setLastUpdated(new Date().toLocaleString());
      } else {
        setError(data.error || 'Validation failed');
      }
    } catch (err) {
      setError(`Failed to run ${validationType} validation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runComprehensiveValidation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/validation/comprehensive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          include_behavioral: true,
          include_multi_agent: true,
          include_environmental: true,
          include_sensor_fusion: true,
          include_failure_mode: true,
          include_hurricane: true,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setValidationData(data.results);
        setLastUpdated(new Date().toLocaleString());
      } else {
        setError(data.error || 'Comprehensive validation failed');
      }
    } catch (err) {
      setError(`Failed to run comprehensive validation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'behavioral', label: '👥 Behavioral', icon: '👥' },
    { id: 'multi-agent', label: '🤖 Multi-Agent', icon: '🤖' },
    { id: 'environmental', label: '🌍 Environmental', icon: '🌍' },
    { id: 'sensor-fusion', label: '🔌 Sensor Fusion', icon: '🔌' },
    { id: 'failure-mode', label: '⚠️ Failure Mode', icon: '⚠️' },
    { id: 'hurricane', label: '🌪️ Hurricane', icon: '🌪️' },
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      {/* API Status */}
      <div className="glass-card p-8 glow-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-cyan-400 glow-text">System Status</h3>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
            apiStatus === 'healthy' ? 'bg-green-900 text-green-300 border border-green-500' :
            apiStatus === 'unavailable' ? 'bg-red-900 text-red-300 border border-red-500' :
            'bg-yellow-900 text-yellow-300 border border-yellow-500'
          }`}>
            {apiStatus === 'healthy' ? '🟢 Connected' :
             apiStatus === 'unavailable' ? '🔴 Disconnected' :
             '🟡 Unknown'}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={runComprehensiveValidation}
            disabled={loading || apiStatus !== 'healthy'}
            className="cyber-gradient text-black px-6 py-4 rounded-lg font-bold text-lg hover-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading ? '🔄 Running Validation...' : '🚀 Run Comprehensive Validation'}
          </button>
          
          <button
            onClick={checkApiHealth}
            className="bg-gray-800 text-cyan-400 px-6 py-4 rounded-lg font-semibold hover-glow border border-cyan-500 transition-all duration-300"
          >
            🔄 Refresh Status
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tabs.slice(1).map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (!validationData?.[tab.id.replace('-', '_')]) {
                runValidation(tab.id.replace('-', '_'));
              }
            }}
            className="glass-card p-6 hover-glow transition-all duration-300 border border-cyan-500/30"
          >
            <div className="text-4xl mb-4">{tab.icon}</div>
            <h3 className="text-xl font-bold text-cyan-400 mb-2">{tab.label.split(' ')[1]}</h3>
            <p className="text-gray-300">
              {validationData?.[tab.id.replace('-', '_')] ? '✅ Data Available' : '⏳ Run Test'}
            </p>
          </button>
        ))}
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="glass-card p-6 border border-cyan-500/30">
          <p className="text-cyan-300 text-center">
            Last updated: {lastUpdated}
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6">
          <p className="text-red-300">{error}</p>
        </div>
      )}
    </div>
  );

  const renderBehavioralSensitivity = () => {
    const data = validationData?.behavioral_sensitivity;
    
    if (!data) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-6 text-lg">No behavioral sensitivity data available</p>
          <button
            onClick={() => runValidation('behavioral-sensitivity')}
            disabled={loading}
            className="cyber-gradient text-black px-6 py-3 rounded-lg font-bold hover-glow disabled:opacity-50 transition-all duration-300"
          >
            {loading ? 'Running...' : 'Run Behavioral Analysis'}
          </button>
        </div>
      );
    }

    const chartData = {
      labels: Object.keys(data),
      datasets: [{
        label: 'RMSE Score',
        data: Object.values(data),
        backgroundColor: 'rgba(0, 245, 212, 0.3)',
        borderColor: 'rgba(0, 245, 212, 1)',
        borderWidth: 3,
        borderRadius: 8,
      }]
    };

    return (
      <div className="space-y-8">
        <div className="glass-card p-8 glow-border">
          <h3 className="text-2xl font-bold text-cyan-400 glow-text mb-6">Player Profile RMSE Analysis</h3>
          <Bar data={chartData} options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { 
                display: true, 
                text: 'Tracking Accuracy by Player Profile',
                color: '#00F5D4',
                font: { size: 16, weight: 'bold' }
              }
            },
            scales: {
              y: { 
                beginAtZero: true, 
                title: { display: true, text: 'RMSE Score', color: '#00F5D4' },
                grid: { color: 'rgba(0, 245, 212, 0.1)' },
                ticks: { color: '#c9d1d9' }
              },
              x: {
                grid: { color: 'rgba(0, 245, 212, 0.1)' },
                ticks: { color: '#c9d1d9' }
              }
            }
          }} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(data).map(([profile, rmse]) => (
            <div key={profile} className="glass-card p-6 glow-border hover-glow transition-all duration-300">
              <h4 className="font-bold text-cyan-400 text-lg mb-2">{profile}</h4>
              <p className="text-3xl font-bold text-cyan-300 glow-text">{rmse.toFixed(4)}</p>
              <p className="text-gray-400">RMSE Score</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMultiAgent = () => {
    const data = validationData?.multi_agent;
    
    if (!data) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-6 text-lg">No multi-agent data available</p>
          <button
            onClick={() => runValidation('multi-agent')}
            disabled={loading}
            className="cyber-gradient text-black px-6 py-3 rounded-lg font-bold hover-glow disabled:opacity-50 transition-all duration-300"
          >
            {loading ? 'Running...' : 'Run Multi-Agent Test'}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="glass-card p-8 glow-border">
          <h3 className="text-2xl font-bold text-cyan-400 glow-text mb-6">Multi-Object Tracking Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <h4 className="font-bold text-cyan-400 mb-4">Overall Performance</h4>
              <p className="text-4xl font-bold text-cyan-300 glow-text">{data.overall_performance?.toFixed(4)}</p>
              <p className="text-gray-400">Average RMSE</p>
            </div>
            <div className="text-center">
              <h4 className="font-bold text-cyan-400 mb-4">Objects Tracked</h4>
              <p className="text-4xl font-bold text-green-400 glow-text">{Object.keys(data.tracking_results || {}).length}</p>
              <p className="text-gray-400">Active Objects</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(data.tracking_results || {}).map(([objectId, results]) => (
            <div key={objectId} className="glass-card p-6 glow-border hover-glow transition-all duration-300">
              <h4 className="font-bold text-cyan-400 text-lg mb-2">{objectId}</h4>
              <p className="text-3xl font-bold text-cyan-300 glow-text">{results.rmse.toFixed(4)}</p>
              <p className="text-gray-400 mb-4">RMSE Score</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Occlusions: {results.occlusion_count}</p>
                <p className="text-sm text-gray-400">Collisions: {results.collision_count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEnvironmental = () => {
    const data = validationData?.environmental;
    
    if (!data) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-6 text-lg">No environmental data available</p>
          <button
            onClick={() => runValidation('environmental')}
            disabled={loading}
            className="cyber-gradient text-black px-6 py-3 rounded-lg font-bold hover-glow disabled:opacity-50 transition-all duration-300"
          >
            {loading ? 'Running...' : 'Run Environmental Test'}
          </button>
        </div>
      );
    }

    const chartData = {
      labels: Object.keys(data),
      datasets: [{
        label: 'RMSE Score',
        data: Object.values(data).map(d => d.rmse),
        backgroundColor: 'rgba(0, 245, 212, 0.3)',
        borderColor: 'rgba(0, 245, 212, 1)',
        borderWidth: 3,
        borderRadius: 8,
      }]
    };

    return (
      <div className="space-y-8">
        <div className="glass-card p-8 glow-border">
          <h3 className="text-2xl font-bold text-cyan-400 glow-text mb-6">Environmental Impact Analysis</h3>
          <Bar data={chartData} options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { 
                display: true, 
                text: 'Tracking Performance by Environment',
                color: '#00F5D4',
                font: { size: 16, weight: 'bold' }
              }
            },
            scales: {
              y: { 
                beginAtZero: true, 
                title: { display: true, text: 'RMSE Score', color: '#00F5D4' },
                grid: { color: 'rgba(0, 245, 212, 0.1)' },
                ticks: { color: '#c9d1d9' }
              },
              x: {
                grid: { color: 'rgba(0, 245, 212, 0.1)' },
                ticks: { color: '#c9d1d9' }
              }
            }
          }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(data).map(([env, results]) => (
            <div key={env} className="glass-card p-6 glow-border hover-glow transition-all duration-300">
              <h4 className="font-bold text-cyan-400 text-lg mb-2 capitalize">{env}</h4>
              <p className="text-3xl font-bold text-cyan-300 glow-text">{results.rmse.toFixed(4)}</p>
              <p className="text-gray-400 mb-4">RMSE Score</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Surface: {results.surface_type}</p>
                <p className="text-sm text-gray-400">Weather Impact: {(results.weather_impact * 100).toFixed(1)}%</p>
                <p className="text-sm text-gray-400">Clutter Impact: {(results.clutter_impact * 100).toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSensorFusion = () => {
    const data = validationData?.sensor_fusion;
    
    if (!data) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-6 text-lg">No sensor fusion data available</p>
          <button
            onClick={() => runValidation('sensor-fusion')}
            disabled={loading}
            className="cyber-gradient text-black px-6 py-3 rounded-lg font-bold hover-glow disabled:opacity-50 transition-all duration-300"
          >
            {loading ? 'Running...' : 'Run Sensor Fusion Test'}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-8 glow-border">
            <h3 className="text-2xl font-bold text-cyan-400 glow-text mb-6">Sensor Combinations</h3>
            <div className="space-y-3">
              {Object.entries(data.sensor_combinations || {}).map(([combo, rmse]) => (
                <div key={combo} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-cyan-500/30">
                  <span className="font-semibold text-cyan-300">{combo}</span>
                  <span className="text-cyan-400 font-bold">{rmse.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-8 glow-border">
            <h3 className="text-2xl font-bold text-cyan-400 glow-text mb-6">Fusion Strategies</h3>
            <div className="space-y-3">
              {Object.entries(data.fusion_strategies || {}).map(([strategy, rmse]) => (
                <div key={strategy} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-cyan-500/30">
                  <span className="font-semibold text-cyan-300 capitalize">{strategy.replace('_', ' ')}</span>
                  <span className="text-green-400 font-bold">{rmse.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card p-8 glow-border">
          <h3 className="text-2xl font-bold text-cyan-400 glow-text mb-6">Dropout Robustness</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(data.dropout_robustness || {}).map(([scenario, score]) => (
              <div key={scenario} className="glass-card p-6 border border-cyan-500/30 hover-glow transition-all duration-300">
                <h4 className="font-bold text-cyan-400 text-lg mb-2 capitalize">{scenario.replace('_', ' ')}</h4>
                <p className="text-3xl font-bold text-purple-400 glow-text">{(score * 100).toFixed(1)}%</p>
                <p className="text-gray-400">Survival Rate</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFailureMode = () => {
    const data = validationData?.failure_mode;
    
    if (!data) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-6 text-lg">No failure mode data available</p>
          <button
            onClick={() => runValidation('failure-mode')}
            disabled={loading}
            className="cyber-gradient text-black px-6 py-3 rounded-lg font-bold hover-glow disabled:opacity-50 transition-all duration-300"
          >
            {loading ? 'Running...' : 'Run Failure Mode Test'}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="glass-card p-8 glow-border">
          <h3 className="text-2xl font-bold text-cyan-400 glow-text mb-6">Failure Mode Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(data.failure_modes || {}).map(([failure, results]) => (
              <div key={failure} className="glass-card p-6 border border-cyan-500/30 hover-glow transition-all duration-300">
                <h4 className="font-bold text-cyan-400 text-lg mb-4 capitalize">{failure.replace('_', ' ')}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Impact:</span>
                    <span className="text-red-400 font-bold">{(results.impact_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Recovery:</span>
                    <span className="text-green-400 font-bold">{(results.recovery_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Probability:</span>
                    <span className="text-cyan-400 font-bold">{(results.probability * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-8 glow-border">
          <h3 className="text-2xl font-bold text-cyan-400 glow-text mb-6">Graceful Degradation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(data.graceful_degradation || {}).map(([failure, score]) => (
              <div key={failure} className="glass-card p-6 border border-cyan-500/30 hover-glow transition-all duration-300">
                <h4 className="font-bold text-cyan-400 text-lg mb-2 capitalize">{failure.replace('_', ' ')}</h4>
                <p className="text-3xl font-bold text-orange-400 glow-text">{(score * 100).toFixed(1)}%</p>
                <p className="text-gray-400">Degradation Score</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderHurricane = () => {
    const data = validationData?.hurricane_protocol;
    
    if (!data) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-6 text-lg">No Hurricane Protocol data available</p>
          <button
            onClick={() => runValidation('hurricane-protocol')}
            disabled={loading}
            className="cyber-gradient text-black px-6 py-3 rounded-lg font-bold hover-glow disabled:opacity-50 transition-all duration-300"
          >
            {loading ? 'Running...' : 'Run Hurricane Protocol'}
          </button>
        </div>
      );
    }

    const chartData = {
      labels: Object.keys(data).map(key => key.replace('intensity_', 'Intensity ')),
      datasets: [{
        label: 'Survival Score',
        data: Object.values(data),
        backgroundColor: 'rgba(239, 68, 68, 0.3)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 3,
        fill: true,
      }]
    };

    return (
      <div className="space-y-8">
        <div className="glass-card p-8 glow-border">
          <h3 className="text-2xl font-bold text-cyan-400 glow-text mb-6">🌪️ Hurricane Protocol™ Results</h3>
          <Line data={chartData} options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { 
                display: true, 
                text: 'System Survival Under Extreme Conditions',
                color: '#00F5D4',
                font: { size: 16, weight: 'bold' }
              }
            },
            scales: {
              y: { 
                beginAtZero: true, 
                max: 1,
                title: { display: true, text: 'Survival Probability', color: '#00F5D4' },
                grid: { color: 'rgba(0, 245, 212, 0.1)' },
                ticks: { color: '#c9d1d9' }
              },
              x: {
                grid: { color: 'rgba(0, 245, 212, 0.1)' },
                ticks: { color: '#c9d1d9' }
              }
            }
          }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(data).map(([intensity, score]) => (
            <div key={intensity} className="glass-card p-6 glow-border hover-glow transition-all duration-300">
              <h4 className="font-bold text-cyan-400 text-lg mb-2">{intensity.replace('intensity_', 'Intensity ')}</h4>
              <p className="text-3xl font-bold text-red-400 glow-text">{(score * 100).toFixed(1)}%</p>
              <p className="text-gray-400">Survival Rate</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'behavioral':
        return renderBehavioralSensitivity();
      case 'multi-agent':
        return renderMultiAgent();
      case 'environmental':
        return renderEnvironmental();
      case 'sensor-fusion':
        return renderSensorFusion();
      case 'failure-mode':
        return renderFailureMode();
      case 'hurricane':
        return renderHurricane();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="glass-card border-b border-cyan-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-4xl font-bold text-cyan-400 glow-text">🔬 Advanced Validation Framework</h1>
              <p className="text-gray-400 text-lg mt-2">Real-time validation and analysis of MatchPoint tracking algorithms</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                apiStatus === 'healthy' ? 'bg-green-900 text-green-300 border border-green-500' :
                apiStatus === 'unavailable' ? 'bg-red-900 text-red-300 border border-red-500' :
                'bg-yellow-900 text-yellow-300 border border-yellow-500'
              }`}>
                {apiStatus === 'healthy' ? '🟢 API Connected' :
                 apiStatus === 'unavailable' ? '🔴 API Disconnected' :
                 '🟡 API Unknown'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="glass-card border-b border-cyan-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-6 px-1 border-b-2 font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'border-cyan-500 text-cyan-400 glow-text'
                    : 'border-transparent text-gray-400 hover:text-cyan-300 hover:border-cyan-500/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
} 