import React, { useState } from 'react';
import { Box, Stack } from '@mui/material';
import { useMatchSimulation } from '../hooks/useMatchSimulation';
import { DashboardHeader } from './DashboardHeader';
import { CurrentCue } from './CurrentCue';
import { Timeline } from './Timeline';
import { CourtHeatmap } from './CourtHeatmap';
import { Scoreboard } from './Scoreboard';
import { PerformanceRadar } from './PerformanceRadar';
import { DemoControls } from './DemoControls';
import { PerformanceProfile } from '../types/tennis';

export const TennisDashboard: React.FC = () => {
  const {
    matchState,
    rallyCount,
    serveSpeed,
    momentum,
    consecutiveErrors,
    timeline,
    isMatchActive,
    getMatchContext,
    startSimulation,
    stopSimulation,
    resetMatch,
  } = useMatchSimulation();

  const [performanceProfile] = useState<PerformanceProfile>({
    Aggressive: 0.7,
    Defensive: 0.6,
    Strategic: 0.8,
    NetPlay: 0.5,
    Serve: 0.75,
  });

  const context = getMatchContext();

  return (
    <Box 
      className="min-h-screen p-4"
      sx={{ 
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        color: 'text.primary'
      }}
    >
      <Box className="container mx-auto">
        <Box 
          className="grid gap-4"
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
          }}
        >
          {/* Header - Full Width */}
          <Box sx={{ gridColumn: { lg: 'span 3' } }}>
            <DashboardHeader />
          </Box>

          {/* Current Cue */}
          <CurrentCue context={context} />

          {/* Timeline */}
          <Timeline timeline={timeline} />

          {/* Court Heatmap - 2 columns on larger screens */}
          <Box sx={{ gridColumn: { sm: 'span 2' } }}>
            <CourtHeatmap />
          </Box>

          {/* Scoreboard - 2 columns on larger screens */}
          <Box sx={{ gridColumn: { sm: 'span 2' } }}>
            <Scoreboard
              matchState={matchState}
              momentum={momentum}
              consecutiveErrors={consecutiveErrors}
              serveSpeed={serveSpeed}
            />
          </Box>

          {/* Performance Radar */}
          <PerformanceRadar performanceProfile={performanceProfile} />

          {/* Demo Controls - Full Width */}
          <Box sx={{ gridColumn: { lg: 'span 3' } }}>
            <DemoControls
              onStartSimulation={startSimulation}
              onStopSimulation={stopSimulation}
              onResetMatch={resetMatch}
              isActive={isMatchActive}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};