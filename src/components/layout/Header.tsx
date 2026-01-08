'use client';

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';
import { Opacity as OilIcon } from '@mui/icons-material';
import UserSelector from '../common/UserSelector';

export default function Header() {
  return (
    <AppBar position="sticky" sx={{ zIndex: (theme) => theme.zIndex.appBar }}>
      <Toolbar>
        <OilIcon sx={{ mr: 2 }} />
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Tank Management
        </Typography>
        <Box>
          <UserSelector />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
