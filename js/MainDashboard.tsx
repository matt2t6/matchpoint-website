import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import {
  Dashboard,
  Assessment,
  Timeline,
  Notifications,
  Settings,
  Menu as MenuIcon,
  CloudCircle,
  Security,
  Business,
  Speed
} from '@mui/icons-material';
import EnterpriseMetricsDashboard from './EnterpriseMetricsDashboard';
import BusinessImpactView from './BusinessImpactView';

const MainDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState('metrics');
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const notifications = [
    {
      id: 1,
      title: 'New Performance Record',
      message: 'System achieved 156ms average latency',
      type: 'success'
    },
    {
      id: 2,
      title: 'M12 Review Scheduled',
      message: 'Technical review scheduled for next week',
      type: 'info'
    },
    {
      id: 3,
      title: 'Azure Integration Update',
      message: 'New features available in Azure integration',
      type: 'info'
    }
  ];

  const menuItems = [
    { text: 'Enterprise Metrics', icon: <Dashboard />, value: 'metrics' },
    { text: 'Business Impact', icon: <Business />, value: 'business' },
    { text: 'Performance', icon: <Speed />, value: 'performance' },
    { text: 'Azure Integration', icon: <CloudCircle />, value: 'azure' },
    { text: 'Compliance', icon: <Security />, value: 'compliance' }
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Side Navigation Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            bgcolor: '#0078D4',
            color: 'white'
          }
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap>
            MatchPoint Enterprise
          </Typography>
        </Toolbar>
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.value}
              selected={currentView === item.value}
              onClick={() => setCurrentView(item.value)}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)'
                  }
                },
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <AppBar
          position="fixed"
          sx={{
            ml: '240px',
            width: 'calc(100% - 240px)',
            bgcolor: 'white',
            color: '#0078D4'
          }}
        >
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {menuItems.find(item => item.value === currentView)?.text}
            </Typography>
            <IconButton
              color="inherit"
              onClick={(e) => setNotificationsAnchor(e.currentTarget)}
            >
              <Badge badgeContent={notifications.length} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            <IconButton color="inherit">
              <Settings />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationsAnchor}
          open={Boolean(notificationsAnchor)}
          onClose={() => setNotificationsAnchor(null)}
        >
          {notifications.map((notification) => (
            <MenuItem key={notification.id}>
              <Box>
                <Typography variant="subtitle2">{notification.title}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {notification.message}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Menu>

        {/* Main Content Area */}
        <Container maxWidth="xl" sx={{ mt: 10, mb: 4 }}>
          {currentView === 'metrics' && <EnterpriseMetricsDashboard />}
          {currentView === 'business' && <BusinessImpactView />}
          {/* Add other views as needed */}
        </Container>
      </Box>
    </Box>
  );
};

export default MainDashboard;
