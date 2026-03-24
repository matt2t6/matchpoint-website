import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Card, CardHeader, CardContent, Grid, Typography,
  Box, Button, CircularProgress, Chip, IconButton,
  useTheme, Paper, Divider
} from '@mui/material';
import {
  TrendingUp, TrendingDown, CheckCircle, Warning,
  Refresh, Download, BarChart as BarChartIcon,
  PieChart as PieChartIcon, Timeline, CloudQueue
} from '@mui/icons-material';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Azure Theme Colors
const azureColors = {
  primary: '#0078D4',
  secondary: '#50E6FF',
  success: '#107C10',
  warning: '#FFB900',
  error: '#E81123',
  neutral: '#3B3B3B',
  background: '#F8F9FA'
};

interface MetricCard {
  title: string;
  value: number;
  unit: string;
  trend: number;
  status: 'success' | 'warning' | 'error';
}

interface ComplianceStatus {
  name: string;
  status: boolean;
  lastChecked: string;
}

const EnterpriseMetricsDashboard: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');
  const [viewMode, setViewMode] = useState('business');

  // Animated Value Display
  const AnimatedValue: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1 }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      let startTime: number;
      let animationFrame: number;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = (currentTime - startTime) / (duration * 1000);

        if (progress < 1) {
          setDisplayValue(Math.floor(value * progress));
          animationFrame = requestAnimationFrame(animate);
        } else {
          setDisplayValue(value);
        }
      };

      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return <span>{displayValue.toLocaleString()}</span>;
  };

  // Business Impact Metrics
  const businessMetrics: MetricCard[] = [
    {
      title: 'Energy Savings',
      value: 2750000,
      unit: 'kWh',
      trend: 15.3,
      status: 'success'
    },
    {
      title: 'Cost Reduction',
      value: 50000000,
      unit: 'USD',
      trend: 40.2,
      status: 'success'
    },
    {
      title: 'Carbon Offset',
      value: 1250,
      unit: 'tons',
      trend: 22.5,
      status: 'success'
    },
    {
      title: 'ROI',
      value: 325,
      unit: '%',
      trend: 85.7,
      status: 'success'
    }
  ];

  // Technical SLAs
  const performanceMetrics = useMemo(() => [
    {
      name: 'Latency',
      value: 156,
      target: 200,
      unit: 'ms'
    },
    {
      name: 'Uptime',
      value: 99.995,
      target: 99.99,
      unit: '%'
    },
    {
      name: 'Throughput',
      value: 8500,
      target: 10000,
      unit: 'QPS'
    }
  ], []);

  // Compliance Status
  const complianceStatus: ComplianceStatus[] = [
    { name: 'SOC 2', status: true, lastChecked: '2025-08-10' },
    { name: 'ISO 27001', status: true, lastChecked: '2025-08-09' },
    { name: 'GDPR', status: true, lastChecked: '2025-08-11' },
    { name: 'HIPAA', status: true, lastChecked: '2025-08-10' }
  ];

  return (
    <Box sx={{ bgcolor: azureColors.background, minHeight: '100vh', p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" sx={{ color: azureColors.neutral }}>
            MatchPoint Enterprise Metrics
          </Typography>
          <Box>
            <Button
              variant="contained"
              startIcon={<CloudQueue />}
              sx={{ mr: 2, bgcolor: azureColors.primary }}
            >
              Azure Insights
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              sx={{ color: azureColors.primary }}
            >
              Export Report
            </Button>
          </Box>
        </Box>

        {/* View Toggle */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant={viewMode === 'business' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('business')}
            sx={{ mr: 1 }}
          >
            Business Impact
          </Button>
          <Button
            variant={viewMode === 'technical' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('technical')}
          >
            Technical Metrics
          </Button>
        </Box>

        {/* Main Dashboard Grid */}
        <Grid container spacing={3}>
          {/* Business Impact Cards */}
          {viewMode === 'business' && businessMetrics.map((metric, index) => (
            <Grid item xs={12} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      {metric.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
                      <Typography variant="h4">
                        <AnimatedValue value={metric.value} />
                      </Typography>
                      <Typography variant="subtitle1" sx={{ ml: 1 }}>
                        {metric.unit}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {metric.trend > 0 ? (
                        <TrendingUp sx={{ color: azureColors.success }} />
                      ) : (
                        <TrendingDown sx={{ color: azureColors.error }} />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            metric.trend > 0
                              ? azureColors.success
                              : azureColors.error,
                          ml: 1
                        }}
                      >
                        {Math.abs(metric.trend)}% vs last month
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}

          {/* Technical Metrics */}
          {viewMode === 'technical' && (
            <>
              {/* SLA Performance */}
              <Grid item xs={12} md={8}>
                <Card>
                  <CardHeader
                    title="SLA Performance"
                    action={
                      <IconButton onClick={() => setLoading(true)}>
                        <Refresh />
                      </IconButton>
                    }
                  />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={performanceMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={azureColors.primary}
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="target"
                          stroke={azureColors.warning}
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Compliance Status */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardHeader title="Compliance Status" />
                  <CardContent>
                    {complianceStatus.map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 2
                        }}
                      >
                        <Typography variant="body1">{item.name}</Typography>
                        <Chip
                          icon={item.status ? <CheckCircle /> : <Warning />}
                          label={item.status ? 'Compliant' : 'Review Required'}
                          color={item.status ? 'success' : 'warning'}
                          variant="outlined"
                        />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>

        {/* Azure Integration Status */}
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Azure Integration Status
            </Typography>
            <Grid container spacing={2}>
              {[
                'Azure ML Workspace',
                'Application Insights',
                'Azure Monitor',
                'Key Vault',
                'AKS Cluster'
              ].map((service, index) => (
                <Grid item xs={12} sm={6} md={2.4} key={index}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 1,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }}
                  >
                    <CheckCircle sx={{ color: azureColors.success, mr: 1 }} />
                    <Typography variant="body2">{service}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      </motion.div>
    </Box>
  );
};

export default EnterpriseMetricsDashboard;
