'use client';

import React from 'react';
import { Grid, Typography, Box, CircularProgress, Alert } from '@mui/material';
import TankCard from './TankCard';
import { Tank, PropertyDefinition, Movement, isMovementCompleted } from '@/types';
import { calculateProjectedState } from '@/services/tankCalculations';

interface TankListProps {
  tanks: Tank[];
  properties: PropertyDefinition[];
  movements: Movement[];
  loading?: boolean;
  error?: string | null;
  showProjected?: boolean;
}

export default function TankList({
  tanks,
  properties,
  movements,
  loading = false,
  error = null,
  showProjected = false,
}: TankListProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (tanks.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No tanks found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add a tank to get started
        </Typography>
      </Box>
    );
  }

  // Calculate projected volumes for each tank
  const getProjectedVolume = (tank: Tank): number => {
    const scheduledMovements = movements.filter(
      (m) =>
        !isMovementCompleted(m) &&
        (m.sourceTankId === tank.id || m.destinationTankId === tank.id)
    );
    const projected = calculateProjectedState(tank, scheduledMovements);
    return projected.volume;
  };

  return (
    <Grid container spacing={3}>
      {tanks.map((tank) => (
        <Grid item xs={12} sm={6} md={4} key={tank.id}>
          <TankCard
            tank={tank}
            properties={properties}
            projectedVolume={getProjectedVolume(tank)}
            showProjected={showProjected}
          />
        </Grid>
      ))}
    </Grid>
  );
}
