import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress, Chip } from '@mui/material';
import { Favorite, Psychology, TrendingUp } from '@mui/icons-material';
import { EmotionalState } from '../../types/enums';
import { formatHeartRate, formatPercentage } from '../../utils/formatters';

interface BiometricData {
  heartRate: number;
  stressIndex: number;
  focusLevel: number;
  emotionalState: EmotionalState;
  resonanceResponse: number;
  biometric_insights: string[];
}

interface BiometricMonitorProps {
  biometricData: BiometricData;
  className?: string;
}

const BiometricMonitor: React.FC<BiometricMonitorProps> = ({
  biometricData,
  className = ''
}) => {
  const getEmotionalStateColor = (state: EmotionalState) => {
    switch (state) {
      case EmotionalState.FOCUSED:
        return 'success';
      case EmotionalState.CALM:
        return 'info';
      case EmotionalState.EXCITED:
        return 'warning';
      case EmotionalState.STRESSED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return '#38a169'; // green
    if (value >= 60) return '#f6ad55'; // orange
    return '#e53e3e'; // red
  };

  return (
    <Card className={`bg-slate-800/50 border border-slate-700 ${className}`}>
      <CardContent className="p-6">
        <Box className="flex items-center gap-2 mb-6">
          <Psychology className="text-cyan-400" />
          <Typography variant="h5" className="text-cyan-400 font-bold">
            Biometric Intelligence Engine
          </Typography>
        </Box>

        {/* Primary Metrics */}
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Box className="text-center p-4 rounded-lg bg-slate-700/30">
            <Favorite className="text-red-400 mb-2" fontSize="large" />
            <Typography variant="h3" className="text-red-400 font-bold">
              {formatHeartRate(biometricData.heartRate)}
            </Typography>
            <Typography variant="body2" className="text-slate-400">
              Heart Rate
            </Typography>
          </Box>
          
          <Box className="text-center p-4 rounded-lg bg-slate-700/30">
            <TrendingUp className="text-orange-400 mb-2" fontSize="large" />
            <Typography variant="h3" className="text-orange-400 font-bold">
              {biometricData.stressIndex}
            </Typography>
            <Typography variant="body2" className="text-slate-400">
              Stress Index
            </Typography>
          </Box>
          
          <Box className="text-center p-4 rounded-lg bg-slate-700/30">
            <Psychology className="text-green-400 mb-2" fontSize="large" />
            <Typography variant="h3" className="text-green-400 font-bold">
              {formatPercentage(biometricData.focusLevel)}
            </Typography>
            <Typography variant="body2" className="text-slate-400">
              Focus Level
            </Typography>
          </Box>
        </Box>

        {/* Emotional State & 432Hz Response */}
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Box className="p-4 rounded-lg bg-slate-700/30">
            <Typography variant="h6" className="text-slate-200 font-semibold mb-3">
              Emotional State
            </Typography>
            <Chip
              label={biometricData.emotionalState}
              color={getEmotionalStateColor(biometricData.emotionalState)}
              size="medium"
              className="mb-2"
            />
            <Typography variant="body2" className="text-slate-400">
              Current emotional resonance state
            </Typography>
          </Box>
          
          <Box className="p-4 rounded-lg bg-slate-700/30">
            <Typography variant="h6" className="text-slate-200 font-semibold mb-3">
              432Hz Resonance Response
            </Typography>
            <Box className="mb-2">
              <LinearProgress
                variant="determinate"
                value={biometricData.resonanceResponse}
                className="h-3 rounded-full"
                sx={{
                  backgroundColor: 'rgba(148, 163, 184, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getProgressColor(biometricData.resonanceResponse),
                  }
                }}
              />
            </Box>
            <Typography variant="body2" className="text-slate-400">
              {formatPercentage(biometricData.resonanceResponse)} harmonic alignment
            </Typography>
          </Box>
        </Box>

        {/* Biometric Insights */}
        <Box>
          <Typography variant="h6" className="text-slate-200 font-semibold mb-4">
            Real-time Insights
          </Typography>
          <Box className="space-y-3">
            {biometricData.biometric_insights.map((insight, index) => (
              <Box
                key={index}
                className="p-3 rounded-lg bg-slate-700/30 border-l-4 border-cyan-400"
              >
                <Typography variant="body2" className="text-slate-300">
                  {insight}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BiometricMonitor;