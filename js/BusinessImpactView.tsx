import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Button,
  Tooltip,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Assessment,
  ShowChart,
  MonetizationOn,
  CloudQueue,
  EcoIcon,
  Speed,
  Timeline,
  Insights
} from '@mui/icons-material';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { motion } from 'framer-motion';

interface ROIMetric {
  label: string;
  current: number;
  projected: number;
  unit: string;
  icon: React.ReactNode;
}

const BusinessImpactView: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1y');
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const roiMetrics: ROIMetric[] = [
    {
      label: 'Annual Energy Savings',
      current: 2750000,
      projected: 3500000,
      unit: 'kWh',
      icon: <EcoIcon />
    },
    {
      label: 'Cost Reduction',
      current: 50000000,
      projected: 65000000,
      unit: 'USD',
      icon: <MonetizationOn />
    },
    {
      label: 'Carbon Offset',
      current: 1250,
      projected: 1800,
      unit: 'tons',
      icon: <CloudQueue />
    },
    {
      label: 'System Efficiency',
      current: 92,
      projected: 98,
      unit: '%',
      icon: <Speed />
    }
  ];

  const projectedGrowth = [
    { month: 'Jan', actual: 42, projected: 45 },
    { month: 'Feb', actual: 48, projected: 50 },
    { month: 'Mar', actual: 55, projected: 55 },
    { month: 'Apr', actual: 62, projected: 60 },
    { month: 'May', actual: 70, projected: 65 },
    { month: 'Jun', actual: 75, projected: 70 }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Business Impact & ROI Analysis
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Real-time analysis of MatchPoint's impact on your bottom line
          </Typography>
        </Box>

        {/* ROI Metrics Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {roiMetrics.map((metric, index) => (
            <Grid item xs={12} md={3} key={index}>
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-4px)',
                      transition: 'all 0.3s'
                    }
                  }}
                  onClick={() => setExpandedMetric(metric.label)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {metric.icon}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {metric.label}
                      </Typography>
                    </Box>
                    <Typography variant="h4" gutterBottom>
                      {metric.current.toLocaleString()} {metric.unit}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(metric.current / metric.projected) * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2" sx={{ mt: 1 }} color="textSecondary">
                        Target: {metric.projected.toLocaleString()} {metric.unit}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Growth Projection Chart */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Growth Projection</Typography>
              <Box>
                {['3m', '6m', '1y', '2y'].map((timeframe) => (
                  <Button
                    key={timeframe}
                    variant={selectedTimeframe === timeframe ? 'contained' : 'outlined'}
                    size="small"
                    sx={{ ml: 1 }}
                    onClick={() => setSelectedTimeframe(timeframe)}
                  >
                    {timeframe.toUpperCase()}
                  </Button>
                ))}
              </Box>
            </Box>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={projectedGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="actual" fill="#0078D4" />
                <Line type="monotone" dataKey="projected" stroke="#FFB900" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Investment Timeline */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Investment Timeline
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <Timeline />
                  <Box sx={{ ml: 2, flex: 1 }}>
                    <Typography variant="subtitle1">Initial Investment</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Projected ROI breakeven in 8 months
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={65}
                      sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Microsoft Co-Sell Status
                </Typography>
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <CloudQueue sx={{ fontSize: 48, color: '#0078D4' }} />
                  <Typography variant="h5" sx={{ mt: 2 }}>
                    Co-Sell Ready
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Fully integrated with Azure ecosystem
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
};

export default BusinessImpactView;
