import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { SystemStatus } from '../../types/enums';
import { formatSystemStatus } from '../../utils/formatters';
import { CircuitBoard } from 'lucide-react';

interface ServiceHealthIndicatorProps {
  serviceName: string;
  status: SystemStatus;
  responseTime?: number;
  uptime?: number;
  className?: string;
}

const ServiceHealthIndicator: React.FC<ServiceHealthIndicatorProps> = ({
  serviceName,
  status,
  responseTime,
  uptime,
  className = ''
}) => {
  const getStatusColor = (status: SystemStatus) => {
    switch (status) {
      case SystemStatus.HEALTHY:
        return 'success';
      case SystemStatus.WARNING:
        return 'warning';
      case SystemStatus.ERROR:
      case SystemStatus.UNAVAILABLE:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusBgColor = (status: SystemStatus) => {
    switch (status) {
      case SystemStatus.HEALTHY:
        return 'bg-green-900/20 border-green-500/50';
      case SystemStatus.WARNING:
        return 'bg-yellow-900/20 border-yellow-500/50';
      case SystemStatus.ERROR:
      case SystemStatus.UNAVAILABLE:
        return 'bg-red-900/20 border-red-500/50';
      default:
        return 'bg-slate-700/20 border-slate-500/50';
    }
  };

  return (
    <Box className={`p-4 rounded-lg border ${getStatusBgColor(status)} ${className}`}>
      <Box className="flex items-center justify-between mb-3">
        <Box className="flex items-center gap-2">
          <CircuitBoard size={20} className="text-cyan-400" />
          <Typography variant="subtitle1" className="text-slate-200 font-semibold">
            {serviceName}
          </Typography>
        </Box>
        <Chip
          label={formatSystemStatus(status)}
          color={getStatusColor(status)}
          size="small"
          variant="outlined"
        />
      </Box>
      
      {(responseTime || uptime) && (
        <Box className="flex gap-4 text-sm text-slate-400">
          {responseTime && (
            <Box>
              <span>Response: </span>
              <span className="text-cyan-400 font-semibold">{responseTime}ms</span>
            </Box>
          )}
          {uptime && (
            <Box>
              <span>Uptime: </span>
              <span className="text-green-400 font-semibold">{uptime.toFixed(1)}%</span>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ServiceHealthIndicator;