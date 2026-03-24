import React, { useState, useEffect } from 'react';
import { 
  Brain, Rocket, Target, Activity, Zap, Clock, 
  TrendingUp, BarChart3, BrainCircuit, Eye, MessageSquare,
  Camera, Trophy, Flame, Zap as Lightning, Heart, Gauge
} from 'lucide-react';
import api from '../utils/apiClient';

const TennisCoachingConsole = () => {
  console.log('🚀 TennisCoachingConsole component mounting...');
  
  const [isSimulationActive, setIsSimulationActive] = useState(true);
  const [aiBrainStatus, setAiBrainStatus] = useState('Active');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Enhanced tennis match state
  const [matchPhase, setMatchPhase] = useState('warmup');
  const [currentGame, setCurrentGame] = useState(1);
  const [currentSet, setCurrentSet] = useState(1);
  const [matchIntensity, setMatchIntensity] = useState(0.3);
  
  // Live data state with tennis match context
  const [liveData, setLiveData] = useState({
    serveSpeed: 129,
    ballSpin: 2644,
    shotAccuracy: 78,
    courtCoverage: 81,
    reactionTime: 0.39,
    flirFps: 226,
    firstServePercentage: 68,
    breakPointConversion: 2,
    unforcedErrors: 8,
    winners: 12,
    netApproaches: 5,
    returnPointsWon: 42
  });

  // Enhanced match data with realistic tennis progression
  const [matchData, setMatchData] = useState({
    player1: { sets: 0, games: 0, points: 0, name: 'Player 1', ranking: 'ATP #45' },
    player2: { sets: 0, games: 0, points: 0, name: 'Player 2', ranking: 'ATP #52' },
    gameStatus: 'LOVE-LOVE',
    serveIndicator: '🎾 P1 SERVING',
    serveSpeed: '127 mph',
    totalPoints: 0,
    rallyCount: 0,
    matchDuration: '00:00',
    breakPoints: 0,
    currentServer: 1,
    deuceCount: 0,
    advantage: null,
    setHistory: [],
    gameHistory: [],
    momentum: 0.5,
    pressureIndex: 0.3
  });

  // Enhanced neural timeline with match context
  const [neuralTimeline, setNeuralTimeline] = useState([
    {
      persona: 'RecoveryCoach',
      message: 'Match starting. Focus on your breathing rhythm.',
      color: 'bg-green-500',
      timestamp: '00:00',
      matchContext: 'warmup',
      intensity: 'low'
    }
  ]);

  // Performance metrics with tennis match progression
  const [performanceMetrics, setPerformanceMetrics] = useState({
    positiveResponseRate: 94,
    improvementVelocity: 2.3,
    coachingInteractions: 156,
    successRate: 87,
    serveEfficiency: 72,
    returnEffectiveness: 68,
    mentalToughness: 85,
    tacticalAdaptation: 79
  });

  const [matchStartTime] = useState(Date.now());

  // Tennis match flow simulation
  const simulateMatchProgression = () => {
    const now = Date.now();
    const matchTime = Math.floor((now - matchStartTime) / 1000);
    
    setMatchData(prev => ({
      ...prev,
      matchDuration: `${Math.floor(matchTime / 60).toString().padStart(2, '0')}:${(matchTime % 60).toString().padStart(2, '0')}`
    }));

    if (matchTime > 0 && matchTime % 30 === 0) {
      simulatePoint();
    }

    updateMatchIntensity();
  };

  // Simulate a tennis point with realistic outcomes
  const simulatePoint = () => {
    const isServer = matchData.currentServer === 1;
    const serverAdvantage = isServer ? 0.15 : -0.15;
    const baseWinProbability = 0.5 + serverAdvantage;
    const adjustedProbability = baseWinProbability + (matchData.momentum * 0.1);
    const pointWon = Math.random() < adjustedProbability;
    
    if (pointWon) {
      updateTennisScore(1);
      updateMomentum(0.1);
    } else {
      updateTennisScore(2);
      updateMomentum(-0.1);
    }
    
    generateMatchContextCoaching();
  };

  // Update tennis score following official rules
  const updateTennisScore = (scoringPlayer) => {
    setMatchData(prev => {
      const newData = { ...prev };
      const player = scoringPlayer === 1 ? newData.player1 : newData.player2;
      
      if (player.points === 0) player.points = 15;
      else if (player.points === 15) player.points = 30;
      else if (player.points === 30) player.points = 40;
      else if (player.points === 40) {
        const otherPlayer = scoringPlayer === 1 ? newData.player2 : newData.player1;
        if (otherPlayer.points === 40) {
          if (newData.advantage === scoringPlayer) {
            player.points = 0;
            otherPlayer.points = 0;
            newData.advantage = null;
            updateGameScore(scoringPlayer);
          } else if (newData.advantage === null) {
            newData.advantage = scoringPlayer;
          } else {
            newData.advantage = null;
          }
        } else {
          player.points = 0;
          otherPlayer.points = 0;
          updateGameScore(scoringPlayer);
        }
      }
      
      newData.totalPoints++;
      newData.rallyCount = Math.floor(Math.random() * 8) + 3;
      
      return newData;
    });
  };

  // Update game score
  const updateGameScore = (scoringPlayer) => {
    setMatchData(prev => {
      const newData = { ...prev };
      const player = scoringPlayer === 1 ? newData.player1 : newData.player2;
      
      player.games++;
      
      if (player.games >= 6) {
        const otherPlayer = scoringPlayer === 1 ? newData.player2 : newData.player1;
        if (player.games - otherPlayer.games >= 2 || player.games === 7) {
          player.sets++;
          player.games = 0;
          otherPlayer.games = 0;
          
          if (player.sets >= 2) {
            setMatchPhase('match_point');
          } else {
            setCurrentSet(prev => prev + 1);
            setMatchPhase(`set_${currentSet + 1}`);
          }
        }
      }
      
      newData.currentServer = newData.currentServer === 1 ? 2 : 1;
      newData.serveIndicator = `🎾 P${newData.currentServer} SERVING`;
      
      return newData;
    });
  };

  // Update momentum based on recent performance
  const updateMomentum = (change) => {
    setMatchData(prev => ({
      ...prev,
      momentum: Math.max(-1, Math.min(1, prev.momentum + change))
    }));
  };

  // Generate coaching based on match context
  const generateMatchContextCoaching = () => {
    const isCloseGame = Math.abs(matchData.player1.games - matchData.player2.games) <= 1;
    const isBreakPoint = matchData.player1.points === 40 && matchData.player2.points === 30;
    
    let coachingMessage = '';
    let persona = 'TacticalCoach';
    let intensity = 'medium';
    
    if (isBreakPoint) {
      coachingMessage = 'Break point opportunity! Stay aggressive on your return.';
      persona = 'MentalResetAgent';
      intensity = 'high';
    } else if (isCloseGame && matchData.momentum < 0) {
      coachingMessage = 'Game is tight. Focus on consistency over power.';
      persona = 'RecoveryCoach';
      intensity = 'medium';
    } else if (matchData.momentum > 0.7) {
      coachingMessage = 'You have momentum! Keep the pressure on.';
      persona = 'TacticalCoach';
      intensity = 'high';
    }
    
    if (coachingMessage) {
      addCoachingEntry(persona, coachingMessage, intensity);
    }
  };

  // Add coaching entry to timeline
  const addCoachingEntry = (persona, message, intensity) => {
    const newEntry = {
      persona,
      message,
      color: getPersonaColor(persona),
      timestamp: matchData.matchDuration,
      matchContext: matchPhase,
      intensity
    };
    
    setNeuralTimeline(prev => [newEntry, ...prev.slice(0, 9)]);
  };

  // Get color based on persona
  const getPersonaColor = (persona) => {
    const colors = {
      'RecoveryCoach': 'bg-green-500',
      'TacticalCoach': 'bg-blue-500',
      'MentalResetAgent': 'bg-orange-500',
      'PerformanceAnalyst': 'bg-purple-500'
    };
    return colors[persona] || 'bg-cyan-500';
  };

  // Update match intensity based on score and time
  const updateMatchIntensity = () => {
    let intensity = 0.3;
    
    if (currentSet > 1) intensity += 0.2;
    if (matchPhase === 'tiebreak') intensity += 0.3;
    if (matchPhase === 'match_point') intensity += 0.4;
    
    const gameDiff = Math.abs(matchData.player1.games - matchData.player2.games);
    if (gameDiff <= 1) intensity += 0.2;
    if (gameDiff === 0) intensity += 0.1;
    
    intensity += Math.abs(matchData.momentum) * 0.2;
    
    setMatchIntensity(Math.min(1, intensity));
    updatePressureIndex(intensity);
  };

  // Update pressure index for player
  const updatePressureIndex = (intensity) => {
    let pressure = 0.3;
    
    if (matchData.player1.points === 40 && matchData.player2.points === 30) pressure += 0.3;
    if (matchData.player1.points === 30 && matchData.player2.points === 40) pressure += 0.2;
    
    if (matchData.player1.games === 5 && matchData.player2.games === 4) pressure += 0.2;
    if (matchData.player1.games === 4 && matchData.player2.games === 5) pressure += 0.3;
    
    if (matchData.player1.sets === 1 && matchData.player2.sets === 0) pressure += 0.1;
    if (matchData.player1.sets === 0 && matchData.player2.sets === 1) pressure += 0.2;
    
    pressure += intensity * 0.3;
    
    setMatchData(prev => ({
      ...prev,
      pressureIndex: Math.min(1, pressure)
    }));
  };

  // Fetch live data from the API
  const fetchLiveData = async () => {
    console.log('🔄 Starting fetchLiveData...');
    console.log('🔍 Current state - isLoading:', isLoading, 'error:', error);
    
    try {
      console.log('📡 Calling api.liveStatus()...');
      const liveStatus = await api.liveStatus();
      console.log('✅ liveStatus response:', liveStatus);
      
      console.log('📡 Calling api.liveAll()...');
      const liveAll = await api.liveAll();
      console.log('✅ liveAll response:', liveAll);
      
      console.log('📡 Calling api.tennisLiveCues()...');
      const tennisCues = await api.tennisLiveCues().catch((err) => {
        console.log('⚠️ tennisLiveCues failed:', err);
        return null;
      });
      console.log('✅ tennisLiveCues response:', tennisCues);

      if (liveAll?.tennis?.player_state) {
        const playerState = liveAll.tennis.player_state;
        setLiveData(prev => ({
          ...prev,
          serveSpeed: playerState.serve_speed || prev.serveSpeed,
          ballSpin: playerState.spin_rate || prev.ballSpin,
          shotAccuracy: playerState.shot_accuracy || prev.shotAccuracy,
          courtCoverage: playerState.court_coverage || prev.courtCoverage,
          reactionTime: playerState.reaction_time || prev.reactionTime,
          flirFps: liveAll.flir?.fps || prev.flirFps
        }));
      }

      if (liveAll?.orchestration?.playback_history) {
        const history = liveAll.orchestration.playback_history.slice(0, 5);
        const timeline = history.map((entry, index) => ({
          persona: entry.persona || `Coach${index + 1}`,
          message: entry.cue_text || 'Processing coaching data...',
          color: ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-cyan-500'][index % 5],
          timestamp: new Date(entry.timestamp * 1000).toLocaleTimeString('en-US', { 
            hour12: false, 
            minute: '2-digit', 
            second: '2-digit' 
          })
        }));
        setNeuralTimeline(timeline);
      }

      if (liveAll?.emotional?.performance_state) {
        setPerformanceMetrics(prev => ({
          ...prev,
          positiveResponseRate: liveAll.emotional.performance_state === 'Peak' ? 94 : 87,
          improvementVelocity: liveAll.emotional.fatigue_index < 0.2 ? 2.3 : 1.8,
          coachingInteractions: (prev.coachingInteractions || 0) + 1,
          successRate: liveAll.emotional.performance_state === 'Peak' ? 87 : 82
        }));
      }

      if (liveAll?.tennis?.match_state) {
        const matchState = liveAll.tennis.match_state;
        setMatchData(prev => ({
          ...prev,
          totalPoints: (prev.totalPoints || 0) + 1,
          rallyCount: matchState.rally_count || prev.rallyCount,
          matchDuration: matchState.duration || prev.matchDuration,
          breakPoints: matchState.break_points || prev.breakPoints
        }));
      }

    } catch (err) {
      console.error('❌ Error fetching live data:', err);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and set up interval
  useEffect(() => {
    console.log('🔧 useEffect running - setting up intervals...');
    fetchLiveData();
    
    const interval = setInterval(fetchLiveData, 5000);
    const matchInterval = setInterval(simulateMatchProgression, 1000);
    
    return () => {
      console.log('🧹 Cleaning up intervals...');
      clearInterval(interval);
      clearInterval(matchInterval);
    };
  }, []);

  // Handle mission control actions
  const handleLaunchMissionControl = async () => {
    try {
      console.log('🚀 Mission Control Launched');
      await fetchLiveData();
    } catch (err) {
      console.error('Error launching mission control:', err);
    }
  };

  const handleIgniteSystems = async () => {
    try {
      console.log('🔥 Systems Ignited');
      await api.liveStatus();
      await fetchLiveData();
    } catch (err) {
      console.error('Error igniting systems:', err);
    }
  };

  const handleTestDataFetch = async () => {
    try {
      console.log('🧪 Testing Data Fetch');
      console.log('🔍 About to call fetchLiveData...');
      await fetchLiveData();
      console.log('✅ fetchLiveData completed successfully');
    } catch (err) {
      console.error('❌ Error testing data fetch:', err);
    }
  };

  // Format current time for display
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    console.log('⏳ Component is in loading state...');
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-cyan-400 text-xl font-bold">INITIALIZING MISSION CONTROL</div>
          <div className="text-slate-400 text-sm mt-2">Connecting to neural networks...</div>
        </div>
      </div>
    );
  }

  console.log('🎯 Component rendering main UI...');
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 w-full bg-black/90 backdrop-blur-md z-40 py-2 shadow-xl border-b border-cyan-400/20">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            {/* MatchPoint Logo */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg blur-xl opacity-40 group-hover:opacity-60 transition-all duration-500"></div>
              <div className="relative bg-transparent rounded-lg p-1 border border-cyan-400/50 shadow-xl backdrop-blur-sm w-16 h-16 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded flex items-center justify-center text-white font-bold text-lg">
                  MP
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-3xl font-black text-white">AI SOUL</div>
              <div className="text-xs text-cyan-400 font-bold tracking-widest">MISSION CONTROL</div>
            </div>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#dashboard" className="text-slate-300 hover:text-cyan-400 transition-all duration-300 font-bold tracking-wide">MISSION CONTROL</a>
            <a href="#contact" className="text-slate-300 hover:text-cyan-400 transition-all duration-300 font-bold tracking-wide">CONTACT</a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        <section className="container mx-auto px-4 py-4">
          <div className="text-center mb-6">
            {/* Compact Header with Logo and Title */}
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl blur-2xl opacity-30 animate-pulse"></div>
                <div className="relative bg-transparent rounded-xl p-2 border border-cyan-400/50 shadow-xl w-16 h-16 flex items-center justify-center backdrop-blur-sm overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded flex items-center justify-center text-white font-bold text-lg">
                    MP
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white">
                  AI SOUL MISSION CONTROL
                </h2>
                <p className="text-sm text-slate-400">
                  <span className="text-green-400">🟢 NEURAL NETWORK ACTIVE</span> | 
                  <span className="text-green-400">🧠 AI ORCHESTRATION ONLINE</span> | 
                  <span className="text-green-400">💫 EMOTIONAL INTELLIGENCE ENGAGED</span>
                </p>
                <div className="text-xs text-cyan-400 mt-1">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    minute: '2-digit', 
                    second: '2-digit' 
                  })} | Live Data Stream
                </div>
              </div>
            </div>

            {/* Live Data Stream Indicator */}
            <div className="flex justify-center items-center space-x-4 mb-4">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-cyan-400 font-bold text-sm">LIVE DATA STREAM ACTIVE</span>
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
            </div>

            {/* Mission Control Launch Buttons */}
            <div className="flex justify-center space-x-4 mb-4">
              <button 
                onClick={handleLaunchMissionControl}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 
                         text-white font-bold py-3 px-8 rounded-lg border border-cyan-400/50 
                         transition-all duration-300 transform hover:scale-105 hover:shadow-lg 
                         shadow-cyan-400/25 flex items-center space-x-3"
              >
                <Rocket className="w-5 h-5" />
                <span className="text-lg">🚀 LAUNCH MISSION CONTROL</span>
              </button>
               
              <button 
                onClick={handleIgniteSystems}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 
                         text-white font-bold py-3 px-8 rounded-lg border border-orange-400/50 
                         transition-all duration-300 transform hover:scale-105 hover:shadow-lg 
                         shadow-orange-400/25 flex items-center space-x-3"
              >
                <Flame className="w-5 h-5" />
                <span className="text-lg">🔥 IGNITE SYSTEMS</span>
              </button>
               
              <button 
                onClick={handleTestDataFetch}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 
                         text-white font-bold py-2 px-6 rounded-lg border border-blue-400/50 
                         transition-all duration-300 transform hover:scale-105 hover:shadow-lg 
                         shadow-blue-400/25 flex items-center space-x-3 mt-2"
              >
                <Lightning className="w-4 h-4" />
                <span className="text-sm">🧪 TEST DATA FETCH</span>
              </button>
            </div>

            {/* Server Status Indicators */}
            <div className="flex justify-center space-x-6 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-slate-400">MatchPoint API (5001)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-slate-400">Live Data Bridge (5002)</span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/50 border border-red-400/30 rounded-lg p-4 mb-4 text-center">
              <div className="text-red-400 font-bold">⚠️ Connection Error</div>
              <div className="text-red-300 text-sm">{error}</div>
              <button 
                onClick={fetchLiveData}
                className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* Live Performance Analytics */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-cyan-400/30 mb-4 p-4">
            <div className="p-2 border-b border-slate-700 flex items-center space-x-2 mb-3">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold">LIVE PERFORMANCE ANALYTICS</h3>
              <div className="ml-auto flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                <span className="text-xs text-cyan-400 font-bold">LIVE</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {/* Serve Speed */}
              <div className="bg-slate-800/50 rounded-lg p-2 border border-cyan-400/30">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-cyan-400">SERVE SPEED</h4>
                  <button 
                    onClick={fetchLiveData}
                    className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                    title="Refresh Data"
                  >
                    <TrendingUp className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-white">{liveData.serveSpeed}</div>
                  <div className="text-xs text-slate-400">mph</div>
                  <div className="text-xs text-slate-500">Max: 137</div>
                </div>
              </div>
               
              {/* First Serve Percentage */}
              <div className="bg-slate-800/50 rounded-lg p-2 border border-green-400/30">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-green-400">1ST SERVE %</h4>
                  <button 
                    onClick={fetchLiveData}
                    className="text-xs text-slate-400 hover:text-green-400 transition-colors"
                    title="Refresh Data"
                  >
                    <TrendingUp className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-white">{liveData.firstServePercentage}%</div>
                  <div className="text-xs text-slate-400">accuracy</div>
                  <div className="text-xs text-slate-500">Target: 70%</div>
                </div>
              </div>
               
              {/* Ball Spin */}
              <div className="bg-slate-800/50 rounded-lg p-2 border border-blue-400/30">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-blue-400">BALL SPIN</h4>
                  <button 
                    onClick={fetchLiveData}
                    className="text-xs text-slate-400 hover:text-blue-400 transition-colors"
                    title="Refresh Data"
                  >
                    <TrendingUp className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-white">{liveData.ballSpin}</div>
                  <div className="text-xs text-slate-400">rpm</div>
                  <div className="text-xs text-slate-500">Sidespin</div>
                </div>
              </div>
               
              {/* Shot Accuracy */}
              <div className="bg-slate-800/50 rounded-lg p-2 border border-green-400/30">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-green-400">SHOT ACCURACY</h4>
                  <button 
                    onClick={fetchLiveData}
                    className="text-xs text-slate-400 hover:text-green-400 transition-colors"
                    title="Refresh Data"
                  >
                    <TrendingUp className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-white">{liveData.shotAccuracy}</div>
                  <div className="text-xs text-slate-400">% on target</div>
                  <div className="text-xs text-slate-500">10/10 last</div>
                </div>
              </div>
               
              {/* Court Coverage */}
              <div className="bg-slate-800/50 rounded-lg p-2 border border-purple-400/30">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-purple-400">COURT COVERAGE</h4>
                  <button 
                    onClick={fetchLiveData}
                    className="text-xs text-slate-400 hover:text-purple-400 transition-colors"
                    title="Refresh Data"
                  >
                    <TrendingUp className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-white">{liveData.courtCoverage}</div>
                  <div className="text-xs text-slate-400">% of court</div>
                  <div className="text-xs text-slate-500">1.1 km</div>
                </div>
              </div>
               
              {/* Reaction Time */}
              <div className="bg-slate-800/50 rounded-lg p-2 border border-yellow-400/30">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-yellow-400">REACTION TIME</h4>
                  <button 
                    onClick={fetchLiveData}
                    className="text-xs text-slate-400 hover:text-yellow-400 transition-colors"
                    title="Refresh Data"
                  >
                    <TrendingUp className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-white">{liveData.reactionTime}</div>
                  <div className="text-xs text-slate-400">seconds</div>
                  <div className="text-xs text-slate-500">Best: 0.34s</div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Tennis Scoreboard */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-yellow-400/20 bg-gradient-to-r from-slate-900 to-slate-800 mb-3 p-4">
            <div className="p-2 border-b border-yellow-400/10">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-yellow-400 flex items-center">
                  <span className="mr-1">🏆</span>LIVE MATCH
                </h3>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-xs text-green-400 font-bold">LIVE</span>
                  <div className="text-xs text-slate-400">Court 1</div>
                </div>
              </div>
               
              {/* Ultra Compact Scoreboard Layout */}
              <div className="grid grid-cols-3 gap-2">
                {/* Player 1 (Left) */}
                <div className="text-center">
                  <div className="text-xs font-bold text-blue-400 mb-0.5">P1</div>
                  <div className="text-lg font-black text-white mb-0.5">{matchData.player1.sets}</div>
                  <div className="text-xs text-slate-400 mb-1">SETS</div>
                  <div className="text-base font-bold text-blue-400 mb-0.5">{matchData.player1.games}</div>
                  <div className="text-xs text-slate-400 mb-1">GAMES</div>
                  <div className="text-sm font-bold text-blue-400">{matchData.player1.points}</div>
                  <div className="text-xs text-slate-400">POINTS</div>
                </div>
                 
                {/* Match Status */}
                <div className="text-center flex flex-col justify-center">
                  <div className="text-xl font-black text-yellow-400 mb-0.5">4-4</div>
                  <div className="text-xs text-slate-400 mb-0.5">GAME</div>
                  <div className="text-sm font-bold text-cyan-400 mb-0.5">{matchData.gameStatus}</div>
                  <div className="text-xs text-slate-400 mb-1">STATUS</div>
                  <div className="text-xs font-bold text-green-400">{matchData.serveIndicator}</div>
                  <div className="text-xs text-slate-400">{matchData.serveSpeed}</div>
                  {/* Match Phase Indicator */}
                  <div className="mt-1">
                    <div className="text-xs font-bold text-purple-400 uppercase">{matchPhase.replace('_', ' ')}</div>
                    <div className="text-xs text-slate-400">Phase</div>
                  </div>
                </div>
                 
                {/* Player 2 (Right) */}
                <div className="text-center">
                  <div className="text-xs font-bold text-red-400 mb-0.5">P2</div>
                  <div className="text-lg font-black text-white mb-0.5">{matchData.player2.sets}</div>
                  <div className="text-xs text-slate-400 mb-1">SETS</div>
                  <div className="text-base font-bold text-red-400 mb-0.5">{matchData.player2.games}</div>
                  <div className="text-xs text-slate-400 mb-1">GAMES</div>
                  <div className="text-sm font-bold text-red-400">{matchData.player2.points}</div>
                  <div className="text-xs text-slate-400">POINTS</div>
                </div>
              </div>
               
              {/* Compact Match Progress Bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                  <span>Progress</span>
                  <span>Set {currentSet}, Game {currentGame}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-blue-400 to-red-400 h-1.5 rounded-full transition-all duration-500" 
                       style={{width: '45%'}}></div>
                </div>
              </div>
            </div>
             
            {/* Ultra Compact Match Stats */}
            <div className="grid grid-cols-4 gap-2 p-2 bg-slate-800/50">
              <div className="text-center">
                <div className="text-sm font-bold text-cyan-400">{matchData.totalPoints}</div>
                <div className="text-xs text-slate-400">Points</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-green-400">{matchData.rallyCount}</div>
                <div className="text-xs text-slate-400">Rally</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-purple-400">{matchData.matchDuration}</div>
                <div className="text-xs text-slate-400">Time</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-yellow-400">{matchData.breakPoints}</div>
                <div className="text-xs text-slate-400">Breaks</div>
              </div>
            </div>
             
            {/* Match Intensity & Momentum */}
            <div className="p-2 bg-slate-700/50 border-t border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Match Intensity</span>
                <span className="text-xs text-cyan-400 font-bold">{Math.round(matchIntensity * 100)}%</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 h-2 rounded-full transition-all duration-500" 
                  style={{width: `${matchIntensity * 100}%`}}
                ></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Momentum</span>
                <span className={`text-xs font-bold ${matchData.momentum > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {matchData.momentum > 0 ? '+' : ''}{Math.round(matchData.momentum * 100)}
                </span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    matchData.momentum > 0 ? 'bg-green-400' : 'bg-red-400'
                  }`}
                  style={{width: `${Math.abs(matchData.momentum) * 100}%`}}
                ></div>
              </div>
            </div>
          </div>

          {/* Neural Timeline */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 mb-4">
            <div className="p-2 border-b border-slate-700 flex items-center space-x-2 mb-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100">NEURAL TIMELINE</h3>
              <div className="ml-auto flex items-center space-x-2">
                <button 
                  onClick={fetchLiveData}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors" 
                  title="Refresh Timeline"
                >
                  <TrendingUp className="w-3 h-3" />
                </button>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                <span className="text-xs text-cyan-400 font-bold">LIVE</span>
              </div>
            </div>
            <div className="p-1 max-h-[70vh] overflow-y-auto">
              {neuralTimeline.map((entry, index) => (
                <div key={index} className="flex items-start gap-3 p-2 hover:bg-slate-700/50 rounded transition-colors">
                  <div className={`w-1 h-12 ${entry.color} rounded-full mt-1`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-blue-400 text-sm">{entry.persona}</div>
                      <div className={`text-xs px-2 py-0.5 rounded ${
                        entry.intensity === 'high' ? 'bg-red-500/20 text-red-400' :
                        entry.intensity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {entry.intensity}
                      </div>
                    </div>
                    <div className="text-slate-300 text-xs">{entry.message}</div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-slate-500 text-xs">{entry.timestamp}</div>
                      <div className="text-slate-600 text-xs capitalize">{entry.matchContext}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TennisCoachingConsole;
