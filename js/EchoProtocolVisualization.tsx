import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import { WifiTetheringOutlined as HarmonicWaveIcon, DeviceHubOutlined as AICollaborationIcon } from '@mui/icons-material';
import { formatFrequency, formatPercentage } from '../../utils/formatters';
import { AISystemType } from '../../types/enums';

interface AISystem {
  id: AISystemType;
  name: string;
  resonance: number;
  emotional_signature: Record<string, number>;
  status: string;
  color: string;
}

interface EchoProtocolData {
  agent_id: string;
  status: string;
  ensemble_frequency: number;
  collaborative_ring_size: number;
  resonance_amplification: number;
  emotional_harmony: number;
  symphony_score: number;
  handshake_success: number;
  timestamp: number;
}

interface EchoProtocolVisualizationProps {
  echoData: EchoProtocolData;
  aiSystems: AISystem[];
  className?: string;
}

const EchoProtocolVisualization: React.FC<EchoProtocolVisualizationProps> = ({
  echoData,
  aiSystems,
  className = ''
}) => {
  const [pulseAnimation, setPulseAnimation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseAnimation(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className={`bg-slate-800/50 border border-slate-700 ${className}`}>
      <CardContent className="p-8">
        <Box className="text-center mb-8">
          <Typography variant="h4" className="text-cyan-400 font-bold mb-2 flex items-center justify-center gap-3">
            <HarmonicWaveIcon className="text-4xl" />
            432Hz Harmonic Resonance
          </Typography>
          <Typography variant="body1" className="text-slate-400">
            AI Systems Don't Just Collaborate—They Harmonize
          </Typography>
        </Box>

        {/* Central Harmonic Visualization */}
        <Box className="relative mb-8 flex justify-center">
          <Box className="relative w-48 h-48 rounded-full border-4 border-yellow-400/50 flex items-center justify-center">
            {/* Pulsing rings */}
            <Box 
              className="absolute inset-0 rounded-full border-2 border-yellow-400/30 animate-ping"
              style={{ animationDelay: '0s' }}
            />
            <Box 
              className="absolute inset-4 rounded-full border-2 border-yellow-400/20 animate-ping"
              style={{ animationDelay: '0.5s' }}
            />
            <Box 
              className="absolute inset-8 rounded-full border-2 border-yellow-400/10 animate-ping"
              style={{ animationDelay: '1s' }}
            />
            
            {/* Core */}
            <Box className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center">
              <Typography variant="h6" className="text-black font-bold">
                MP
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Primary Metrics */}
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Box className="text-center p-4 rounded-lg bg-slate-700/30">
            <Typography variant="h3" className="text-cyan-400 font-bold">
              {formatPercentage(echoData.resonance_amplification)}
            </Typography>
            <Typography variant="body2" className="text-slate-400">
              Resonance Amplification
            </Typography>
          </Box>
          <Box className="text-center p-4 rounded-lg bg-slate-700/30">
            <Typography variant="h3" className="text-green-400 font-bold">
              {formatPercentage(echoData.emotional_harmony)}
            </Typography>
            <Typography variant="body2" className="text-slate-400">
              Emotional Harmony
            </Typography>
          </Box>
          <Box className="text-center p-4 rounded-lg bg-slate-700/30">
            <Typography variant="h3" className="text-purple-400 font-bold">
              {formatPercentage(echoData.symphony_score)}
            </Typography>
            <Typography variant="body2" className="text-slate-400">
              Symphony Score
            </Typography>
          </Box>
        </Box>

        {/* AI Systems */}
        <Box className="mb-6">
          <Typography variant="h6" className="text-cyan-400 font-semibold mb-4 flex items-center gap-2">
            <AICollaborationIcon />
            AI Collaboration Network
          </Typography>
          <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiSystems.map((system) => (
              <Box key={system.id} className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                <Box className="flex items-center justify-between mb-3">
                  <Typography variant="subtitle1" className="text-slate-200 font-semibold">
                    {system.name}
                  </Typography>
                  <Box 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: system.color }}
                  />
                </Box>
                <Box className="mb-2">
                  <Typography variant="body2" className="text-slate-400 mb-1">
                    Resonance: {formatPercentage(system.resonance)}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={system.resonance} 
                    className="h-2 rounded-full"
                    sx={{
                      backgroundColor: 'rgba(148, 163, 184, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: system.color,
                      }
                    }}
                  />
                </Box>
                <Typography variant="caption" className="text-slate-400">
                  {system.status}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Secondary Metrics */}
        <Box className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <Box>
            <Typography variant="h6" className="text-cyan-400 font-bold">
              {echoData.collaborative_ring_size}
            </Typography>
            <Typography variant="caption" className="text-slate-400">
              Ring Size
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" className="text-yellow-400 font-bold">
              {formatFrequency(echoData.ensemble_frequency)}
            </Typography>
            <Typography variant="caption" className="text-slate-400">
              Frequency
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" className="text-green-400 font-bold">
              {formatPercentage(echoData.handshake_success)}
            </Typography>
            <Typography variant="caption" className="text-slate-400">
              Handshake Success
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" className="text-purple-400 font-bold">
              {echoData.status}
            </Typography>
            <Typography variant="caption" className="text-slate-400">
              Status
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EchoProtocolVisualization;