'use client';

import React from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { useUser } from '@/context/UserContext';

export default function UserSelector() {
  const { currentUser, users, setCurrentUser, loading } = useUser();

  const handleChange = (event: SelectChangeEvent<string>) => {
    const userId = event.target.value;
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  if (loading) {
    return <CircularProgress size={24} color="inherit" />;
  }

  if (users.length === 0) {
    return (
      <Typography variant="body2" color="inherit">
        No users
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <PersonIcon />
      <FormControl size="small" variant="outlined">
        <Select
          value={currentUser?.id || ''}
          onChange={handleChange}
          sx={{
            color: 'inherit',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.8)',
            },
            '& .MuiSvgIcon-root': {
              color: 'inherit',
            },
            minWidth: 150,
          }}
        >
          {users.map((user) => (
            <MenuItem key={user.id} value={user.id}>
              {user.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
