'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as CurrentIcon,
  TrendingUp as ProjectedIcon,
} from '@mui/icons-material';
import TankList from '@/components/tanks/TankList';
import AddTankDialog from '@/components/tanks/AddTankDialog';
import { useTanks } from '@/hooks/useTanks';
import { useProperties } from '@/hooks/useProperties';
import { useMovements } from '@/hooks/useMovements';

export default function DashboardPage() {
  const { tanks, loading: tanksLoading, error: tanksError, createTank, refresh: refreshTanks } = useTanks();
  const { properties, loading: propertiesLoading } = useProperties();
  const { movements, refresh: refreshMovements } = useMovements();

  const [showProjected, setShowProjected] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: boolean | null
  ) => {
    if (newView !== null) {
      setShowProjected(newView);
    }
  };

  const handleAddTank = async (data: {
    name: string;
    product: string;
    location: string;
    currentVolume: number;
    properties: { propertyId: string; value: number | null }[];
  }) => {
    await createTank(data);
    refreshTanks();
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Tank Dashboard
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <ToggleButtonGroup
            value={showProjected}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <ToggleButton value={false}>
              <Tooltip title="Current Values">
                <CurrentIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value={true}>
              <Tooltip title="Projected Values">
                <ProjectedIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Tank
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {showProjected
            ? 'Showing projected values based on scheduled movements'
            : 'Showing current tank values'}
        </Typography>
      </Box>

      <TankList
        tanks={tanks}
        properties={properties}
        movements={movements}
        loading={tanksLoading || propertiesLoading}
        error={tanksError}
        showProjected={showProjected}
      />

      <AddTankDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAddTank}
        properties={properties}
      />
    </Box>
  );
}
