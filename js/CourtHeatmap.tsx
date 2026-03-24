import React, { useRef, useEffect, useState } from 'react';
import { Paper, Typography, Box } from '@mui/material';

interface CourtHeatmapProps {
  onShotAdded?: (outcome: string) => void;
}

export const CourtHeatmap: React.FC<CourtHeatmapProps> = ({ onShotAdded }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shotCount, setShotCount] = useState(0);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Clear and draw court
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw court outline
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      canvas.width * 0.1,
      canvas.height * 0.1,
      canvas.width * 0.8,
      canvas.height * 0.8
    );
    
    // Draw center line
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.1, canvas.height * 0.5);
    ctx.lineTo(canvas.width * 0.9, canvas.height * 0.5);
    ctx.stroke();
    
    // Draw service boxes
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.5, canvas.height * 0.1);
    ctx.lineTo(canvas.width * 0.5, canvas.height * 0.9);
    ctx.stroke();
  };

  const addShot = (outcome: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Random position within court bounds
    const x = canvas.width * 0.1 + Math.random() * canvas.width * 0.8;
    const y = canvas.height * 0.1 + Math.random() * canvas.height * 0.8;

    // Draw shot marker
    ctx.fillStyle = outcome === 'WINNER' ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();

    setShotCount(prev => prev + 1);
    onShotAdded?.(outcome);
  };

  const resetCanvas = () => {
    setShotCount(0);
    initializeCanvas();
  };

  useEffect(() => {
    initializeCanvas();
    
    // Handle window resize
    const handleResize = () => {
      setTimeout(initializeCanvas, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Simulate shots for demo
  useEffect(() => {
    const interval = setInterval(() => {
      const outcomes = ['WINNER', 'ERROR', 'WINNER', 'ERROR'];
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      addShot(outcome);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Paper className="p-4 sm:col-span-2">
      <Typography variant="h2" gutterBottom>
        Court Heatmap
      </Typography>
      
      <Box className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-64 bg-slate-900 rounded"
          style={{ backgroundColor: '#1e293b' }}
        />
      </Box>
      
      <Typography variant="body2" className="text-center mt-2" color="text.secondary">
        {shotCount} shots
      </Typography>
    </Paper>
  );
};