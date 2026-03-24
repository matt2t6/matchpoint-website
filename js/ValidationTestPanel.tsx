import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Button, Tabs, Tab, LinearProgress } from '@mui/material';
import { ScienceOutlined as ValidationIcon } from '@mui/icons-material';
import { ValidationTestType } from '../../types/enums';
import { formatRMSE, formatPercentage } from '../../utils/formatters';

interface ValidationResult {
  [key: string]: any;
}

interface ValidationTestPanelProps {
  validationResults: Record<ValidationTestType, ValidationResult>;
  onRunValidation: (testType: ValidationTestType) => Promise<void>;
  loading: boolean;
  className?: string;
}

const ValidationTestPanel: React.FC<ValidationTestPanelProps> = ({
  validationResults,
  onRunValidation,
  loading,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<ValidationTestType>(ValidationTestType.BEHAVIORAL);

  const testTypes = [
    { id: ValidationTestType.BEHAVIORAL, label: 'Behavioral', icon: '👥' },
    { id: ValidationTestType.MULTI_AGENT, label: 'Multi-Agent', icon: '🤖' },
    { id: ValidationTestType.ENVIRONMENTAL, label: 'Environmental', icon: '🌍' },
    { id: ValidationTestType.SENSOR_FUSION, label: 'Sensor Fusion', icon: '🔌' },
    { id: ValidationTestType.FAILURE_MODE, label: 'Failure Mode', icon: '⚠️' },
    { id: ValidationTestType.HURRICANE_PROTOCOL, label: 'Hurricane Protocol', icon: '🌪️' }
  ];

  const renderBehavioralResults = () => {
    const data = validationResults[ValidationTestType.BEHAVIORAL];
    if (!data) return null;

    return (
      <Box className="space-y-4">
        <Typography variant="h6" className="text-cyan-400 font-semibold">
          Player Profile RMSE Analysis
        </Typography>
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data).map(([profile, rmse]) => (
            <Box key={profile} className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
              <Typography variant="subtitle1" className="text-slate-200 font-semibold mb-2">
                {profile}
              </Typography>
              <Typography variant="h4" className="text-cyan-400 font-bold">
                {formatRMSE(rmse as number)}
              </Typography>
              <Typography variant="caption" className="text-slate-400">
                RMSE Score
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderMultiAgentResults = () => {
    const data = validationResults[ValidationTestType.MULTI_AGENT];
    if (!data) return null;

    return (
      <Box className="space-y-4">
        <Typography variant="h6" className="text-cyan-400 font-semibold">
          Multi-Object Tracking Performance
        </Typography>
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Box className="text-center p-4 rounded-lg bg-slate-700/30">
            <Typography variant="h4" className="text-cyan-400 font-bold">
              {formatRMSE(data.overall_performance)}
            </Typography>
            <Typography variant="caption" className="text-slate-400">
              Overall Performance
            </Typography>
          </Box>
          <Box className="text-center p-4 rounded-lg bg-slate-700/30">
            <Typography variant="h4" className="text-green-400 font-bold">
              {Object.keys(data.tracking_results || {}).length}
            </Typography>
            <Typography variant="caption" className="text-slate-400">
              Objects Tracked
            </Typography>
          </Box>
        </Box>
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(data.tracking_results || {}).map(([objectId, results]: [string, any]) => (
            <Box key={objectId} className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
              <Typography variant="subtitle1" className="text-slate-200 font-semibold mb-2">
                {objectId}
              </Typography>
              <Typography variant="h5" className="text-cyan-400 font-bold mb-2">
                {formatRMSE(results.rmse)}
              </Typography>
              <Box className="space-y-1 text-sm text-slate-400">
                <div>Occlusions: {results.occlusion_count}</div>
                <div>Collisions: {results.collision_count}</div>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderHurricaneResults = () => {
    const data = validationResults[ValidationTestType.HURRICANE_PROTOCOL];
    if (!data) return null;

    return (
      <Box className="space-y-4">
        <Typography variant="h6" className="text-cyan-400 font-semibold">
          🌪️ Hurricane Protocol™ Results
        </Typography>
        <Box className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(data).map(([intensity, score]) => (
            <Box key={intensity} className="p-4 rounded-lg bg-slate-700/30 border border-slate-600 text-center">
              <Typography variant="subtitle1" className="text-slate-200 font-semibold mb-2">
                {intensity.replace('intensity_', 'Intensity ')}
              </Typography>
              <Typography variant="h4" className="text-red-400 font-bold mb-1">
                {formatPercentage(score as number * 100)}
              </Typography>
              <Typography variant="caption" className="text-slate-400">
                Survival Rate
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderTestResults = () => {
    switch (activeTab) {
      case ValidationTestType.BEHAVIORAL:
        return renderBehavioralResults();
      case ValidationTestType.MULTI_AGENT:
        return renderMultiAgentResults();
      case ValidationTestType.HURRICANE_PROTOCOL:
        return renderHurricaneResults();
      default:
        return (
          <Box className="text-center py-8">
            <Typography variant="body1" className="text-slate-400 mb-4">
              No data available for {testTypes.find(t => t.id === activeTab)?.label}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => onRunValidation(activeTab)}
              disabled={loading}
              startIcon={<ValidationIcon />}
            >
              {loading ? 'Running...' : 'Run Test'}
            </Button>
          </Box>
        );
    }
  };

  return (
    <Card className={`bg-slate-800/50 border border-slate-700 ${className}`}>
      <CardContent className="p-6">
        <Box className="flex items-center gap-2 mb-6">
          <ValidationIcon className="text-cyan-400" />
          <Typography variant="h5" className="text-cyan-400 font-bold">
            Advanced Validation Framework
          </Typography>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          className="mb-6"
          sx={{
            '& .MuiTab-root': {
              color: '#94a3b8',
              '&.Mui-selected': {
                color: '#00F5D4'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00F5D4'
            }
          }}
        >
          {testTypes.map((test) => (
            <Tab
              key={test.id}
              value={test.id}
              label={
                <Box className="flex items-center gap-2">
                  <span>{test.icon}</span>
                  <span>{test.label}</span>
                </Box>
              }
            />
          ))}
        </Tabs>

        {loading && (
          <Box className="mb-4">
            <LinearProgress className="rounded-full" />
            <Typography variant="caption" className="text-slate-400 mt-2">
              Running validation tests...
            </Typography>
          </Box>
        )}

        {renderTestResults()}
      </CardContent>
    </Card>
  );
};

export default ValidationTestPanel;