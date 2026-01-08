'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { Tank, PropertyDefinition, PropertyValue, Movement } from '@/types';
import TankLevelChart from '@/components/charts/TankLevelChart';

interface TankDetailViewProps {
  tank: Tank;
  properties: PropertyDefinition[];
  movements: Movement[];
  projectedVolume?: number;
  projectedProperties?: PropertyValue[];
}

const HORIZON_OPTIONS = [
  { value: 7, label: '7 Days' },
  { value: 14, label: '14 Days' },
  { value: 30, label: '30 Days' },
  { value: 60, label: '60 Days' },
  { value: 90, label: '90 Days' },
];

export default function TankDetailView({
  tank,
  properties,
  movements,
  projectedVolume,
  projectedProperties,
}: TankDetailViewProps) {
  const [horizonDays, setHorizonDays] = useState(30);

  const handleHorizonChange = (
    event: React.MouseEvent<HTMLElement>,
    newHorizon: number | null
  ) => {
    if (newHorizon !== null) {
      setHorizonDays(newHorizon);
    }
  };
  const getPropertyDefinition = (propertyId: string): PropertyDefinition | undefined => {
    return properties.find((p) => p.id === propertyId);
  };

  const getPropertyValue = (
    propList: PropertyValue[],
    propertyId: string
  ): number | null => {
    const prop = propList.find((p) => p.propertyId === propertyId);
    return prop?.value ?? null;
  };

  const volumeChange =
    projectedVolume !== undefined ? projectedVolume - tank.currentVolume : 0;

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Volume Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Current Volume
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h3" component="span">
                {tank.currentVolume.toFixed(1)}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                KB
              </Typography>
            </Box>

            {projectedVolume !== undefined && volumeChange !== 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Projected Volume (after scheduled movements)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h5" component="span">
                    {projectedVolume.toFixed(1)} KB
                  </Typography>
                  <Chip
                    size="small"
                    icon={volumeChange > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    label={`${volumeChange > 0 ? '+' : ''}${volumeChange.toFixed(1)} KB`}
                    color={volumeChange > 0 ? 'success' : 'warning'}
                  />
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Info Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tank Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Product
                </Typography>
                <Typography variant="body1">
                  {tank.product || 'Carbon Black Oil'}
                </Typography>
              </Box>
              {tank.location && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1">
                    {tank.location}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">
                  {new Date(tank.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {new Date(tank.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Properties Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Properties
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Property</TableCell>
                    <TableCell align="right">Current Value</TableCell>
                    <TableCell>Unit</TableCell>
                    {projectedProperties && projectedProperties.length > 0 && (
                      <>
                        <TableCell align="right">Projected Value</TableCell>
                        <TableCell align="right">Change</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {properties.map((propDef) => {
                    const currentValue = getPropertyValue(tank.properties, propDef.id);
                    const projectedValue = projectedProperties
                      ? getPropertyValue(projectedProperties, propDef.id)
                      : null;
                    const change =
                      currentValue !== null && projectedValue !== null
                        ? projectedValue - currentValue
                        : null;

                    return (
                      <TableRow key={propDef.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {propDef.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {currentValue !== null ? currentValue.toFixed(2) : '-'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {propDef.unit}
                          </Typography>
                        </TableCell>
                        {projectedProperties && projectedProperties.length > 0 && (
                          <>
                            <TableCell align="right">
                              {projectedValue !== null ? projectedValue.toFixed(2) : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {change !== null && change !== 0 && (
                                <Chip
                                  size="small"
                                  label={`${change > 0 ? '+' : ''}${change.toFixed(2)}`}
                                  color={change > 0 ? 'success' : 'warning'}
                                  variant="outlined"
                                />
                              )}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Chart Section */}
        <Grid item xs={12}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Projection Horizon:
            </Typography>
            <ToggleButtonGroup
              value={horizonDays}
              exclusive
              onChange={handleHorizonChange}
              size="small"
            >
              {HORIZON_OPTIONS.map((option) => (
                <ToggleButton key={option.value} value={option.value}>
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <TankLevelChart
            tank={tank}
            movements={movements}
            horizonDays={horizonDays}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
