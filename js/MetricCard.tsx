import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { formatPercentage } from '../../utils/formatters';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon,
  color = 'primary',
  trend,
  className = ''
}) => {
  const getColorClass = (colorType: string) => {
    const colorMap = {
      primary: 'text-cyan-400',
      secondary: 'text-yellow-400',
      success: 'text-green-400',
      warning: 'text-orange-400',
      error: 'text-red-400',
      info: 'text-blue-400'
    };
    return colorMap[colorType as keyof typeof colorMap] || 'text-cyan-400';
  };

  return (
    <Card className={`bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 transition-all duration-300 ${className}`}>
      <CardContent className="p-6">
        <Box className="flex items-start justify-between mb-4">
          <Box className="flex items-center gap-2">
            {icon && <Box className={`${getColorClass(color)}`}>{icon}</Box>}
            <Typography variant="h6" className="text-slate-200 font-semibold">
              {title}
            </Typography>
          </Box>
          {trend && (
            <Box className={`flex items-center gap-1 text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              <span>{formatPercentage(Math.abs(trend.value))}</span>
            </Box>
          )}
        </Box>
        
        <Box className="mb-2">
          <Typography variant="h3" className={`font-bold ${getColorClass(color)}`}>
            {typeof value === 'number' ? value.toFixed(1) : value}
            {unit && <span className="text-lg ml-1">{unit}</span>}
          </Typography>
        </Box>
        
        {subtitle && (
          <Typography variant="body2" className="text-slate-400">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;