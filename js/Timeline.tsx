import React, { useState } from 'react';
import { Paper, Typography, Stack, Button, Box } from '@mui/material';
import { TimelineEntry } from '../types/tennis';

interface TimelineProps {
  timeline: TimelineEntry[];
}

type FilterType = 'all' | 'winners' | 'errors' | 'break-points';

export const Timeline: React.FC<TimelineProps> = ({ timeline }) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredTimeline = timeline.filter(entry => {
    switch (filter) {
      case 'winners':
        return entry.outcome === 'WINNER';
      case 'errors':
        return entry.outcome.includes('ERROR');
      case 'break-points':
        return entry.outcome.toLowerCase().includes('break');
      default:
        return true;
    }
  });

  const getOutcomeDisplay = (outcome: string) => {
    switch (outcome) {
      case 'WINNER':
        return 'WINNER';
      case 'SELF_ERROR':
        return 'ERROR';
      case 'OPPONENT_ERROR':
        return 'OPP ERROR';
      case 'FORCED_ERROR':
        return 'FORCED ERROR';
      default:
        return outcome;
    }
  };

  return (
    <Paper className="p-4">
      <Typography variant="h2" gutterBottom>
        Timeline Feed
      </Typography>
      
      <Stack direction="row" spacing={1} className="mb-4">
        {(['all', 'winners', 'errors', 'break-points'] as FilterType[]).map((filterType) => (
          <Button
            key={filterType}
            size="small"
            variant={filter === filterType ? 'contained' : 'outlined'}
            onClick={() => setFilter(filterType)}
            sx={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
          >
            {filterType === 'break-points' ? 'Break Points' : filterType}
          </Button>
        ))}
      </Stack>
      
      <Box className="overflow-y-auto h-64">
        {filteredTimeline.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Awaiting live data...
          </Typography>
        ) : (
          <Stack spacing={1}>
            {filteredTimeline.map((entry, index) => (
              <Box
                key={`${entry.timestamp}-${index}`}
                className="bg-slate-800/50 p-2 rounded"
                sx={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}
              >
                <Typography variant="body2" color="primary.light" fontWeight="bold">
                  {entry.setScore.player}-{entry.setScore.opponent}, {entry.gameScore.player}-{entry.gameScore.opponent}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getOutcomeDisplay(entry.outcome)} • {entry.rallyLength}-shot rally
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  );
};