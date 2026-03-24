import React from 'react';
import { Paper, Typography, Stack, LinearProgress, Chip } from '@mui/material';
import { MatchState } from '../types/tennis';
import { getPointDisplay } from '../utils/tennisScoring';

interface ScoreboardProps {
  matchState: MatchState;
  momentum: number;
  consecutiveErrors: number;
  serveSpeed: number | null;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  matchState,
  momentum,
  consecutiveErrors,
  serveSpeed,
}) => {
  const playerPointDisplay = getPointDisplay(
    matchState.points.player,
    matchState.isDeuce,
    matchState.isAdvantage,
    matchState.advantagePlayer === 'player'
  );
  
  const opponentPointDisplay = getPointDisplay(
    matchState.points.opponent,
    matchState.isDeuce,
    matchState.isAdvantage,
    matchState.advantagePlayer === 'opponent'
  );

  const momentumPercent = Math.max(0, Math.min(100, (momentum + 1) * 50));
  const momentumColor = momentum > 0.3 ? 'success' : momentum < -0.3 ? 'error' : 'primary';

  return (
    <Paper className="p-4 sm:col-span-2">
      <Typography variant="h2" gutterBottom>
        Match Scoreboard
      </Typography>
      
      <Stack spacing={2}>
        <Typography variant="h4" component="div">
          {matchState.sets.player}-{matchState.sets.opponent}, {matchState.games.player}-{matchState.games.opponent}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          Set {matchState.sets.player + matchState.sets.opponent + 1}, 
          Game {matchState.games.player + matchState.games.opponent + 1}
          {matchState.isTieBreak ? ' (Tiebreak)' : ''}
        </Typography>
        
        <Typography variant="h5" component="div">
          {matchState.isTieBreak 
            ? `${matchState.tieBreakScore.player} - ${matchState.tieBreakScore.opponent}`
            : `${playerPointDisplay} - ${opponentPointDisplay}`
          }
        </Typography>
        
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip
            label={matchState.currentServer === 'player' ? 'You' : 'Opponent'}
            color={matchState.currentServer === 'player' ? 'warning' : 'default'}
            size="small"
          />
          
          <Chip
            label={momentum > 0 ? `+${momentum.toFixed(1)}` : momentum.toFixed(1)}
            color={momentumColor}
            size="small"
          />
          
          {consecutiveErrors > 0 && (
            <Chip
              label={`${consecutiveErrors} errors`}
              color={consecutiveErrors >= 2 ? 'error' : 'warning'}
              size="small"
            />
          )}
        </Stack>
        
        <Stack spacing={1}>
          <Typography variant="body2">Momentum</Typography>
          <LinearProgress
            variant="determinate"
            value={momentumPercent}
            color={momentumColor}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Stack>
        
        <Stack direction="row" spacing={4} className="text-sm">
          <Typography variant="body2">
            Serve: {serveSpeed || '--'} mph
          </Typography>
          <Typography variant="body2">
            Spin: {Math.floor(Math.random() * 1000 + 2000)} rpm
          </Typography>
          <Typography variant="body2">
            Accuracy: {Math.floor(Math.random() * 20 + 80)}%
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
};