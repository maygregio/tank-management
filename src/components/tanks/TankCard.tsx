'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Opacity as TankIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { Tank, PropertyDefinition, PropertyValue } from '@/types';

interface TankCardProps {
  tank: Tank;
  properties: PropertyDefinition[];
  projectedVolume?: number;
  showProjected?: boolean;
}

export default function TankCard({
  tank,
  properties,
  projectedVolume,
  showProjected = false,
}: TankCardProps) {
  const router = useRouter();

  const getPropertyValue = (propertyId: string): PropertyValue | undefined => {
    return tank.properties.find((p) => p.propertyId === propertyId);
  };

  const getPropertyDefinition = (propertyId: string): PropertyDefinition | undefined => {
    return properties.find((p) => p.id === propertyId);
  };

  const volumeChange = projectedVolume !== undefined
    ? projectedVolume - tank.currentVolume
    : 0;

  const displayVolume = showProjected && projectedVolume !== undefined
    ? projectedVolume
    : tank.currentVolume;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TankIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h2">
            {tank.name}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {tank.product || 'Carbon Black Oil'}{tank.location ? ` • ${tank.location}` : ''}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Volume
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h4" component="span">
              {displayVolume.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              KB
            </Typography>
            {showProjected && volumeChange !== 0 && (
              <Chip
                size="small"
                icon={volumeChange > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                label={`${volumeChange > 0 ? '+' : ''}${volumeChange.toFixed(1)}`}
                color={volumeChange > 0 ? 'success' : 'warning'}
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Properties
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {tank.properties.slice(0, 4).map((propValue) => {
            const propDef = getPropertyDefinition(propValue.propertyId);
            if (!propDef || propValue.value === null) return null;
            return (
              <Chip
                key={propValue.propertyId}
                label={`${propDef.name}: ${propValue.value} ${propDef.unit}`}
                size="small"
                variant="outlined"
              />
            );
          })}
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          size="small"
          variant="contained"
          onClick={() => router.push(`/tanks/${tank.id}`)}
          fullWidth
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
}
