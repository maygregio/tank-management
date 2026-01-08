'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Tabs, Tab, Box } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

const navItems = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Properties', path: '/properties', icon: <SettingsIcon /> },
  { label: 'Audit Log', path: '/audit', icon: <HistoryIcon /> },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  // Find current tab index, default to 0 if not found (handles /tanks/[id] etc.)
  const currentTab = navItems.findIndex((item) => item.path === pathname);
  const tabValue = currentTab >= 0 ? currentTab : false;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    router.push(navItems[newValue].path);
  };

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="standard"
        sx={{
          minHeight: 48,
          '& .MuiTab-root': {
            minHeight: 48,
            textTransform: 'none',
            fontWeight: 500,
          },
        }}
      >
        {navItems.map((item) => (
          <Tab
            key={item.path}
            icon={item.icon}
            iconPosition="start"
            label={item.label}
          />
        ))}
      </Tabs>
    </Box>
  );
}
