import React from 'react';
import { Paper, Typography, Stack, Chip } from '@mui/material';

export const DashboardHeader: React.FC = () => {
  return (
    <Paper className="p-4 lg:col-span-3 text-center">
      <Typography variant="h1" gutterBottom>
        AI SOUL MISSION CONTROL
      </Typography>
      
      <Stack direction="row" spacing={2} justifyContent="center" className="mt-2">
        <Chip
          label="🟢 SIMULATION ACTIVE"
          color="success"
          size="small"
        />
        <Chip
          label="🧠 AI Brain: Active"
          color="success"
          size="small"
        />
        <Chip
          label="🗣️ Voice Synthesis: Ready"
          color="success"
          size="small"
        />
      </Stack>
    </Paper>
  );
};