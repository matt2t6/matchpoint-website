import React, { useState } from 'react';
import { Paper, Typography, Stack, Button, Alert } from '@mui/material';

interface DemoControlsProps {
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onResetMatch: () => void;
  isActive: boolean;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  onStartSimulation,
  onStopSimulation,
  onResetMatch,
  isActive,
}) => {
  const [mode, setMode] = useState<'broadcast' | 'analysis'>('broadcast');
  const [status, setStatus] = useState('');

  const toggleMode = () => {
    setMode(prev => prev === 'broadcast' ? 'analysis' : 'broadcast');
  };

  const handleLiveCoaching = () => {
    setStatus('Live coaching triggered');
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <Stack spacing={2}>
      <Paper className="p-4">
        <Typography variant="h2" gutterBottom>
          Demo Control
        </Typography>
        
        <Stack direction="row" spacing={1} flexWrap="wrap" className="gap-2">
          <Button
            size="small"
            variant={mode === 'analysis' ? 'contained' : 'outlined'}
            onClick={toggleMode}
          >
            📊 {mode === 'analysis' ? 'Broadcast Mode' : 'Analysis Mode'}
          </Button>
          
          <Button
            size="small"
            variant={mode === 'broadcast' ? 'contained' : 'outlined'}
            onClick={toggleMode}
          >
            📺 Broadcast Mode
          </Button>
          
          <Button
            size="small"
            variant="contained"
            onClick={handleLiveCoaching}
          >
            🎬 Live
          </Button>
          
          <Button
            size="small"
            variant="outlined"
            onClick={() => alert('M12 Mode: Coming soon')}
          >
            🎭 M12
          </Button>
          
          <Button
            size="small"
            variant="outlined"
            onClick={() => alert('Q&A Mode: Coming soon')}
          >
            🎯 Q&A
          </Button>
        </Stack>
        
        {status && (
          <Alert severity="info" className="mt-2">
            {status}
          </Alert>
        )}
      </Paper>

      <Paper className="p-4">
        <Typography variant="h2" gutterBottom>
          Simulation Control
        </Typography>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="success"
            onClick={onStartSimulation}
            disabled={isActive}
          >
            ▶️ Start
          </Button>
          
          <Button
            variant="contained"
            color="error"
            onClick={onStopSimulation}
            disabled={!isActive}
          >
            ⏹️ Stop
          </Button>
          
          <Button
            variant="outlined"
            onClick={onResetMatch}
          >
            🔄 Reset
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
};