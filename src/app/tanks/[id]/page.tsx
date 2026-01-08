'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Refresh as ResetIcon,
} from '@mui/icons-material';
import NextLink from 'next/link';
import TankDetailView from '@/components/tanks/TankDetailView';
import TankResetDialog from '@/components/tanks/TankResetDialog';
import MovementForm from '@/components/movements/MovementForm';
import MovementList from '@/components/movements/MovementList';
import { useTank, useTanks } from '@/hooks/useTanks';
import { useProperties } from '@/hooks/useProperties';
import { useMovements } from '@/hooks/useMovements';
import { calculateProjectedState } from '@/services/tankCalculations';
import { PropertyValue, isMovementCompleted } from '@/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function TankDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tankId = params.id as string;

  const { tank, loading: tankLoading, error: tankError, refresh: refreshTank } = useTank(tankId);
  const { tanks } = useTanks();
  const { properties } = useProperties();
  const {
    movements,
    loading: movementsLoading,
    error: movementsError,
    createMovement,
    deleteMovement,
    refresh: refreshMovements,
  } = useMovements(tankId);

  const [tabValue, setTabValue] = useState(0);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);

  if (tankLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (tankError || !tank) {
    return (
      <Box>
        <Alert severity="error">{tankError || 'Tank not found'}</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push('/')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  // Calculate projected state
  const scheduledMovements = movements.filter((m) => !isMovementCompleted(m));
  const projected = calculateProjectedState(tank, scheduledMovements);

  const handleResetTank = async (volume: number, resetProperties: PropertyValue[]) => {
    const response = await fetch(`/api/tanks/${tank.id}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume, properties: resetProperties }),
    });

    if (!response.ok) {
      throw new Error('Failed to reset tank');
    }

    refreshTank();
  };

  const handleCreateMovement = async (data: Parameters<typeof createMovement>[0]) => {
    await createMovement(data);
    refreshTank();
    refreshMovements();
  };

  const handleDeleteMovement = async (id: string) => {
    await deleteMovement(id);
    refreshMovements();
  };

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href="/" underline="hover" color="inherit">
          Dashboard
        </Link>
        <Typography color="text.primary">{tank.name}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          {tank.name}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ResetIcon />}
            onClick={() => setResetDialogOpen(true)}
          >
            Reset from PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setMovementDialogOpen(true)}
          >
            Add Movement
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Overview" />
          <Tab label={`Movements (${movements.length})`} />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <TankDetailView
          tank={tank}
          properties={properties}
          movements={movements}
          projectedVolume={projected.volume}
          projectedProperties={projected.properties}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <MovementList
          movements={movements}
          tanks={tanks}
          loading={movementsLoading}
          error={movementsError}
          onDelete={handleDeleteMovement}
          showTankNames={true}
        />
      </TabPanel>

      {/* Dialogs */}
      <TankResetDialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onSubmit={handleResetTank}
        tank={tank}
        properties={properties}
      />

      <MovementForm
        open={movementDialogOpen}
        onClose={() => setMovementDialogOpen(false)}
        onSubmit={handleCreateMovement}
        tanks={tanks}
        properties={properties}
        defaultTankId={tank.id}
      />
    </Box>
  );
}
