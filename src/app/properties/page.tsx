'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useProperties } from '@/hooks/useProperties';
import { PropertyDefinition } from '@/types';

export default function PropertiesPage() {
  const {
    properties,
    loading,
    error,
    createProperty,
    updateProperty,
    deleteProperty,
  } = useProperties();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyDefinition | null>(null);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenDialog = (property?: PropertyDefinition) => {
    if (property) {
      setEditingProperty(property);
      setName(property.name);
      setUnit(property.unit);
    } else {
      setEditingProperty(null);
      setName('');
      setUnit('');
    }
    setDialogError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProperty(null);
    setName('');
    setUnit('');
    setDialogError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setDialogError('Property name is required');
      return;
    }

    setSubmitting(true);
    setDialogError(null);

    try {
      if (editingProperty) {
        await updateProperty(editingProperty.id, { name: name.trim(), unit: unit.trim() });
      } else {
        await createProperty({ name: name.trim(), unit: unit.trim() });
      }
      handleCloseDialog();
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Failed to save property');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      await deleteProperty(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete property');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

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
          Property Definitions
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Property
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Define the properties tracked for each tank (e.g., API, Sulfur, Viscosity).
        These properties will be available when adding movements or resetting tank values.
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
              <TableCell>Property Name</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {properties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No properties defined. Add a property to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              properties.map((property) => (
                <TableRow key={property.id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {property.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{property.unit || '-'}</TableCell>
                  <TableCell>
                    {new Date(property.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(property)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(property.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProperty ? 'Edit Property' : 'Add Property'}
        </DialogTitle>
        <DialogContent>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dialogError}
            </Alert>
          )}

          <TextField
            autoFocus
            label="Property Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
            placeholder="e.g., API, Sulfur, Viscosity"
            required
          />

          <TextField
            label="Unit"
            fullWidth
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g., degrees, %, cSt, ppm"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : editingProperty ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
