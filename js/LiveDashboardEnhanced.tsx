import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Stack
} from '@mui/material';
import {
  Dashboard,
  Science,
  WbSunny,
  Psychology,
  Notifications,
  Settings,
  Refresh
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme/theme';
import { mockQuery, mockStore } from '../data/liveDashboardMockData';
// Gateway API client (JS) – using as any for TS interop
import api, { login } from '../utils/apiClient';
import { SystemStatus, ValidationTestType } from '../types/enums';
import EchoProtocolVisualization from './echo/EchoProtocolVisualization';
import ValidationTestPanel from './validation/ValidationTestPanel';
import BiometricMonitor from './biometric/BiometricMonitor';
import MetricCard from './common/MetricCard';
import ServiceHealthIndicator from './common/ServiceHealthIndicator';
import { SpeedOutlined as ResonanceMeterIcon, GraphicEqOutlined as FrequencySpectrumIcon } from '@mui/icons-material';

interface LiveDashboardEnhancedProps {
  title?: string;
  subtitle?: string;
  refreshInterval?: number;
  enableAnimations?: boolean;
  showDebugInfo?: boolean;
}

const LiveDashboardEnhanced: React.FC<LiveDashboardEnhancedProps> = ({
  title = 'Live Dashboard Enhanced',
  subtitle = 'MatchPoint Echo Protocol Integration',
  refreshInterval = 3000,
  enableAnimations = true,
  showDebugInfo = false
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [servicesHealth, setServicesHealth] = useState<Record<string, boolean> | null>(null);
  const [liveStatus, setLiveStatus] = useState<any | null>(null);
  const [echoStatus, setEchoStatus] = useState<any | null>(null);
  const [aiCounters, setAiCounters] = useState({ sessions: 0, recovery: 0, tactical: 0, mental: 0 });
  const [playerState, setPlayerState] = useState<{ fatigue?: number; performance?: string } | null>(null);

  // Mock data state
  const [echoData] = useState(mockQuery.echoProtocolStatus);
  const [aiSystems] = useState(mockQuery.aiSystems);
  const [validationResults] = useState(mockQuery.validationResults);
  const [apiGatewayMetrics] = useState(mockQuery.apiGatewayMetrics);
  const [orchestrationMetrics] = useState(mockQuery.orchestrationMetrics);
  const [physicsSimulation] = useState(mockQuery.physicsSimulation);
  const [biometricData] = useState(mockQuery.biometricData);
  const [liveDataBridge] = useState(mockQuery.liveDataBridge);

  const tabs = [
    { label: 'Overview', icon: <Dashboard /> },
    { label: 'Validation', icon: <Science /> },
    { label: 'Solar Optimization', icon: <WbSunny /> },
    { label: 'Biometrics', icon: <Psychology /> }
  ];

  const notifications = [
    {
      id: 1,
      title: 'Resonance Amplification Peak',
      message: 'System achieved 96.1% resonance amplification',
      type: 'success'
    },
    {
      id: 2,
      title: 'Hurricane Protocol Ready',
      message: 'Stress testing protocols initialized',
      type: 'info'
    },
    {
      id: 3,
      title: 'AI Orchestration Active',
      message: '3 AI agents in harmonic collaboration',
      type: 'info'
    }
  ];

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      try {
        // Attempt auto-login (viewer) once; ignore errors
        await login('viewer', 'viewer123');
      } catch {}
      await refreshData();
      setLastUpdated(new Date());
    };
    const refreshData = async () => {
      try {
        const health = await api.health();
        if (!mounted) return;
        setServicesHealth(health?.services || null);
      } catch {}
      try {
        const live = await api.liveStatus();
        if (!mounted) return;
        setLiveStatus(live);
      } catch {}
      try {
        // Pull orchestration/all for richer analytics if available
        const all = await api.liveAll();
        if (mounted && all) {
          // Normalize shape
          const data = all.data || all;
          const state = data.player_state || {};
          setPlayerState({ fatigue: state.fatigue_level, performance: state.performance_state });
        }
      } catch {}
      try {
        const cues = await api.tennisLiveCues();
        if (mounted && Array.isArray(cues) && cues.length > 0) {
          const counts = cues.reduce(
            (acc: any, item: any) => {
              acc.sessions += 1;
              const persona = item?.final_cue_package?.persona;
              if (persona === 'RecoveryCoach') acc.recovery += 1;
              else if (persona === 'TacticalCoach') acc.tactical += 1;
              else if (persona === 'MentalResetAgent') acc.mental += 1;
              return acc;
            },
            { sessions: 0, recovery: 0, tactical: 0, mental: 0 }
          );
          setAiCounters(counts);
          const latest = cues[0]?.final_cue_package?.player_state;
          if (latest) setPlayerState({ fatigue: latest.fatigue_level, performance: latest.performance_state });
          return; // we have data; skip fallback
        }
      } catch {}
      try {
        // Fallback to live orchestration feed; accept various shapes
        const orchestration: any = await api.liveOrchestration();
        if (!mounted || !orchestration) return;
        const list: any[] = Array.isArray(orchestration)
          ? orchestration
          : (orchestration.history || orchestration.data || orchestration.items || []);
        if (Array.isArray(list) && list.length) {
          const counts = list.reduce(
            (acc: any, item: any) => {
              acc.sessions += 1;
              const persona = item?.final_cue_package?.persona || item?.persona;
              if (persona === 'RecoveryCoach') acc.recovery += 1;
              else if (persona === 'TacticalCoach') acc.tactical += 1;
              else if (persona === 'MentalResetAgent') acc.mental += 1;
              return acc;
            },
            { sessions: 0, recovery: 0, tactical: 0, mental: 0 }
          );
          setAiCounters(counts);
          const latest = list[0]?.final_cue_package?.player_state || list[0]?.player_state;
          if (latest) setPlayerState({ fatigue: latest.fatigue_level, performance: latest.performance_state });
        }
      } catch {}
      try {
        const echo = await api.echoResonance();
        if (!mounted) return;
        setEchoStatus(echo);
      } catch {}
    };

    // initial pull
    tick();
    const interval = setInterval(() => {
      refreshData();
      setLastUpdated(new Date());
    }, refreshInterval);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [refreshInterval]);

  const handleRunValidation = async (testType: ValidationTestType) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  const renderOverview = () => (
    <Stack spacing={4}>
      {/* Section: Gateway & Orchestration */}
      <Typography variant="h6" className="text-cyan-400 font-semibold">Gateway & Orchestration</Typography>
      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Requests"
          value={apiGatewayMetrics.total_requests}
          icon={<Dashboard />}
          color="primary"
        />
        <MetricCard
          title="Active Connections"
          value={apiGatewayMetrics.active_connections}
          icon={<ResonanceMeterIcon />}
          color="success"
        />
        <MetricCard
          title="Response Time"
          value={apiGatewayMetrics.avg_response_time}
          unit="ms"
          icon={<FrequencySpectrumIcon />}
          color="info"
        />
        <MetricCard
          title="Sessions Processed"
          value={orchestrationMetrics.sessions_processed}
          icon={<Psychology />}
          color="secondary"
        />
      </Box>

      {/* Section: Service Health */}
      <Typography variant="h6" className="text-cyan-400 font-semibold">Service Health</Typography>
      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(servicesHealth ?? apiGatewayMetrics.services_health).map(([service, isHealthy]) => (
          <ServiceHealthIndicator
            key={service}
            serviceName={service.replace('-', ' ').toUpperCase()}
            status={isHealthy ? SystemStatus.HEALTHY : SystemStatus.ERROR}
            responseTime={Math.floor(Math.random() * 200) + 50}
            uptime={isHealthy ? 99.9 : 85.2}
          />
        ))}
      </Box>

      {/* Section: AI Coaching */}
      <Typography variant="h6" className="text-cyan-400 font-semibold">AI Coaching Live Analytics</Typography>
      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Coaching Sessions" value={aiCounters.sessions} color="primary" />
        <MetricCard title="Recovery Focus" value={aiCounters.recovery} color="success" />
        <MetricCard title="Tactical Adjustments" value={aiCounters.tactical} color="warning" />
        <MetricCard title="Mental Resets" value={aiCounters.mental} color="secondary" />
      </Box>
      <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard title="Fatigue Level" value={(playerState?.fatigue ?? 0).toFixed(2)} color="info" />
        <MetricCard title="Performance State" value={playerState?.performance ?? '--'} color="success" />
      </Box>

      {/* Section: Physics Simulation */}
      <Typography variant="h6" className="text-cyan-400 font-semibold">Physics-based Trajectory Simulation</Typography>
      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Trajectories Generated"
          value={physicsSimulation.trajectories_generated}
          color="primary"
        />
        <MetricCard
          title="Rally Simulations"
          value={physicsSimulation.rally_simulations}
          color="success"
        />
        <MetricCard
          title="Avg Accuracy"
          value={physicsSimulation.avg_simulation_accuracy.toFixed(4)}
          color="info"
        />
        <MetricCard
          title="Magnus Calculations"
          value={physicsSimulation.magnus_force_calculations}
          color="warning"
        />
      </Box>

      {/* Section: Live Data Bridge */}
      <Typography variant="h6" className="text-cyan-400 font-semibold">Live Data Bridge</Typography>
      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Connections"
          value={(liveStatus?.data?.active_connections ?? liveDataBridge.active_connections) || liveStatus?.active_connections || liveDataBridge.active_connections}
          color="primary"
        />
        <MetricCard
          title="Data Throughput"
          value={(liveStatus?.data?.data_throughput ?? liveDataBridge.data_throughput) || liveStatus?.data_throughput || liveDataBridge.data_throughput}
          color="success"
        />
        <MetricCard
          title="Avg Latency"
          value={(liveStatus?.data?.latency_avg ?? liveDataBridge.latency_avg) || liveStatus?.latency_avg || liveDataBridge.latency_avg}
          unit="ms"
          color="info"
        />
        <MetricCard
          title="Telemetry Streams"
          value={(liveStatus?.data?.telemetry_streams ?? liveDataBridge.telemetry_streams) || liveStatus?.telemetry_streams || liveDataBridge.telemetry_streams}
          color="secondary"
        />
      </Box>

      {/* Section: Echo Protocol */}
      <Typography variant="h6" className="text-cyan-400 font-semibold">Echo Protocol</Typography>
      <EchoProtocolVisualization echoData={echoData} aiSystems={aiSystems} />
    </Stack>
  );

  const renderValidation = () => (
    <ValidationTestPanel
      validationResults={validationResults}
      onRunValidation={handleRunValidation}
      loading={loading}
    />
  );

  const renderBiometrics = () => (
    <BiometricMonitor biometricData={biometricData} />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderOverview();
      case 1:
        return renderValidation();
      case 2:
        return (
          <Typography variant="h6" className="text-slate-400 text-center py-8">
            Solar Optimization Dashboard - Coming Soon
          </Typography>
        );
      case 3:
        return renderBiometrics();
      default:
        return renderOverview();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box className="min-h-screen bg-slate-900">
        {/* App Bar (sticky to avoid overlaying previous slide) */}
        <AppBar position="sticky" className="bg-slate-800 border-b border-slate-700">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} className="text-cyan-400 font-bold">
              {title}
            </Typography>
            <Typography variant="body2" className="text-slate-400 mr-4">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
            <IconButton
              color="inherit"
              onClick={() => setLastUpdated(new Date())}
              className="text-cyan-400"
            >
              <Refresh />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={(e) => setNotificationsAnchor(e.currentTarget)}
              className="text-cyan-400"
            >
              <Badge badgeContent={notifications.length} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            <IconButton color="inherit" className="text-cyan-400">
              <Settings />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Notifications Menu (hidden if none) */}
        {notifications.length > 0 && (
          <Menu
            anchorEl={notificationsAnchor}
            open={Boolean(notificationsAnchor)}
            onClose={() => setNotificationsAnchor(null)}
          >
            {notifications.map((notification) => (
              <MenuItem key={notification.id}>
                <Box>
                  <Typography variant="subtitle2">{notification.title}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {notification.message}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>
        )}

        {/* Main Content */}
        <Box className="pt-4">
          <Container maxWidth="xl" className="py-6">
            {/* Header */}
            <Box className="mb-6">
              <Typography variant="h4" className="text-cyan-400 font-bold mb-2">
                {title}
              </Typography>
              <Typography variant="body1" className="text-slate-400">
                {subtitle}
              </Typography>
            </Box>

            {/* Live Overview Content */}
            {renderOverview()}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default LiveDashboardEnhanced;