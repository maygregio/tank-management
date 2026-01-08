'use client';

import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
  Box,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowDownward as ReceiveIcon,
  ArrowUpward as ShipIcon,
  SwapHoriz as TransferIcon,
  Delete as DeleteIcon,
  CheckCircle as CompletedIcon,
  Schedule as ScheduledIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Movement, Tank, MovementType, getEffectiveVolume, isMovementCompleted } from '@/types';

interface MovementListProps {
  movements: Movement[];
  tanks: Tank[];
  loading?: boolean;
  error?: string | null;
  onDelete?: (id: string) => void;
  showTankNames?: boolean;
}

const typeIcons: Record<MovementType, React.ReactNode> = {
  receive: <ReceiveIcon color="success" />,
  ship: <ShipIcon color="error" />,
  transfer: <TransferIcon color="info" />,
};

const typeLabels: Record<MovementType, string> = {
  receive: 'Receive',
  ship: 'Ship',
  transfer: 'Transfer',
};

export default function MovementList({
  movements,
  tanks,
  loading = false,
  error = null,
  onDelete,
  showTankNames = true,
}: MovementListProps) {
  // Memoize tank lookup map for O(1) access instead of O(n) find() per call
  const tankMap = useMemo(
    () => new Map(tanks.map((t) => [t.id, t.name])),
    [tanks]
  );

  const getTankName = (tankId: string | null): string => {
    if (!tankId) return '-';
    return tankMap.get(tankId) || 'Unknown';
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'MMM d, yyyy');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
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

  if (movements.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No movements found
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Volume (KB)</TableCell>
            {showTankNames && (
              <>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
              </>
            )}
            <TableCell>Status</TableCell>
            <TableCell>Details</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {typeIcons[movement.type]}
                  <Typography variant="body2">
                    {typeLabels[movement.type]}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                {isMovementCompleted(movement)
                  ? formatDate(movement.date)
                  : formatDate(movement.scheduledDate)}
              </TableCell>
              <TableCell align="right">
                <Tooltip
                  title={
                    movement.actualVolume !== undefined
                      ? `Expected: ${movement.expectedVolume.toFixed(1)} KB, Actual: ${movement.actualVolume.toFixed(1)} KB`
                      : `Expected: ${movement.expectedVolume.toFixed(1)} KB (actual pending)`
                  }
                >
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    color={
                      movement.type === 'receive'
                        ? 'success.main'
                        : movement.type === 'ship'
                        ? 'error.main'
                        : 'info.main'
                    }
                    sx={{
                      fontStyle: movement.actualVolume === undefined ? 'italic' : 'normal',
                    }}
                  >
                    {movement.type === 'ship' ? '-' : '+'}
                    {getEffectiveVolume(movement).toFixed(1)}
                    {movement.actualVolume === undefined && '*'}
                  </Typography>
                </Tooltip>
              </TableCell>
              {showTankNames && (
                <>
                  <TableCell>
                    <Typography variant="body2">
                      {getTankName(movement.sourceTankId)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getTankName(movement.destinationTankId)}
                    </Typography>
                  </TableCell>
                </>
              )}
              <TableCell>
                <Chip
                  icon={
                    isMovementCompleted(movement) ? (
                      <CompletedIcon />
                    ) : (
                      <ScheduledIcon />
                    )
                  }
                  label={isMovementCompleted(movement) ? 'Completed' : 'Scheduled'}
                  size="small"
                  color={isMovementCompleted(movement) ? 'success' : 'default'}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {movement.carrier && (
                    <Chip label={movement.carrier} size="small" variant="outlined" />
                  )}
                  {movement.ticketNumber && (
                    <Chip label={`#${movement.ticketNumber}`} size="small" variant="outlined" />
                  )}
                  {movement.pdfPath && (
                    <Tooltip title="Has PDF attachment">
                      <PdfIcon fontSize="small" color="action" />
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
              <TableCell align="right">
                {onDelete && !isMovementCompleted(movement) && (
                  <Tooltip title="Delete scheduled movement">
                    <IconButton
                      size="small"
                      onClick={() => onDelete(movement.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
