'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';
import { useAuditLog } from '@/hooks/useAuditLog';
import { AuditAction, AuditEntityType } from '@/types';

const actionColors: Record<AuditAction, 'success' | 'info' | 'error' | 'warning'> = {
  create: 'success',
  update: 'info',
  delete: 'error',
  reset: 'warning',
};

const entityLabels: Record<AuditEntityType, string> = {
  tank: 'Tank',
  movement: 'Movement',
  property: 'Property',
};

export default function AuditLogPage() {
  const { entries, loading, error } = useAuditLog();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Audit Log
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        View history of all changes made to tanks, movements, and properties.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity Type</TableCell>
              <TableCell>Entity ID</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No audit log entries found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm:ss')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.action.toUpperCase()}
                      size="small"
                      color={actionColors[entry.action]}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {entityLabels[entry.entityType]}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                    >
                      {entry.entityId.slice(0, 12)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{entry.userId}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {entry.description || getDefaultDescription(entry)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function getDefaultDescription(entry: {
  action: AuditAction;
  entityType: AuditEntityType;
}): string {
  const entityLabel = entityLabels[entry.entityType].toLowerCase();
  switch (entry.action) {
    case 'create':
      return `Created new ${entityLabel}`;
    case 'update':
      return `Updated ${entityLabel}`;
    case 'delete':
      return `Deleted ${entityLabel}`;
    case 'reset':
      return `Reset ${entityLabel} values from measurement`;
    default:
      return '';
  }
}
