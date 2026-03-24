import React, { useRef, useEffect } from 'react';
import { Paper, Typography } from '@mui/material';
import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { PerformanceProfile } from '../types/tennis';

// Register Chart.js components
Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface PerformanceRadarProps {
  performanceProfile: PerformanceProfile;
}

export const PerformanceRadar: React.FC<PerformanceRadarProps> = ({ performanceProfile }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const performanceData = [
      performanceProfile.Aggressive,
      performanceProfile.Defensive,
      performanceProfile.Strategic,
      performanceProfile.NetPlay,
      performanceProfile.Serve,
    ];

    const opponentData = performanceData.map(() => Math.random() * 0.5 + 0.3);

    chartRef.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Aggressive', 'Defensive', 'Strategic', 'Net Play', 'Serve'],
        datasets: [
          {
            label: 'Player',
            data: performanceData,
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderColor: '#10b981',
            pointBackgroundColor: '#10b981',
            borderWidth: 2,
          },
          {
            label: 'Opponent',
            data: opponentData,
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderColor: '#ef4444',
            pointBackgroundColor: '#ef4444',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 1,
            ticks: {
              stepSize: 0.2,
              color: '#94a3b8',
            },
            grid: {
              color: '#4b5563',
            },
            pointLabels: {
              font: {
                size: 12,
              },
              color: '#e2e8f0',
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: '#e2e8f0',
            },
          },
          tooltip: {
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            titleColor: '#e2e8f0',
            bodyColor: '#e2e8f0',
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [performanceProfile]);

  return (
    <Paper className="p-4">
      <Typography variant="h2" gutterBottom>
        Performance Radar
      </Typography>
      
      <div style={{ position: 'relative', height: '250px' }}>
        <canvas ref={canvasRef} />
      </div>
    </Paper>
  );
};