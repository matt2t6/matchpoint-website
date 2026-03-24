import React, { useState, useEffect } from 'react';
import { Paper, Typography, Stack, Box } from '@mui/material';
import { MatchContext } from '../types/tennis';

interface CurrentCueProps {
  context: MatchContext;
}

export const CurrentCue: React.FC<CurrentCueProps> = ({ context }) => {
  const [currentCue, setCurrentCue] = useState('Ready...');
  const [persona, setPersona] = useState('TacticalCoach');
  const [lastOutcome, setLastOutcome] = useState('None');

  useEffect(() => {
    // Generate contextual cues based on match situation
    let cue = 'Stay focused';
    let newPersona = 'TacticalCoach';

    if (context.isBreakPoint) {
      cue = 'Break Point Opportunity!';
      newPersona = 'TacticalCoach';
    } else if (context.isSetPoint) {
      cue = 'Set Point - Stay calm!';
      newPersona = 'TacticalCoach';
    } else if (context.consecutiveErrors >= 2) {
      cue = 'Reset and refocus';
      newPersona = 'MentalResetAgent';
    } else if (context.momentum < -0.3) {
      cue = 'Mental reset needed';
      newPersona = 'MentalResetAgent';
    } else if (context.isLongRally) {
      cue = 'Conserve energy';
      newPersona = 'RecoveryCoach';
    }

    setCurrentCue(cue);
    setPersona(newPersona);
  }, [context]);

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'WINNER':
        return '🏆';
      case 'SELF_ERROR':
        return '⚠️';
      case 'OPPONENT_ERROR':
        return '❌';
      case 'FORCED_ERROR':
        return '🎯';
      default:
        return '';
    }
  };

  return (
    <Paper className="p-4">
      <Typography variant="h2" gutterBottom>
        Current Cue
      </Typography>
      
      <Stack spacing={2}>
        <Box className="text-center">
          <Typography variant="h6" component="div" className="min-h-[2rem]">
            {getOutcomeIcon(lastOutcome)} {currentCue}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          {currentCue}
        </Typography>
        
        <Typography variant="body2" color="primary.light">
          {persona}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          Last: {lastOutcome}
        </Typography>
      </Stack>
    </Paper>
  );
};