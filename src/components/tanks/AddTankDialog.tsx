'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Divider,
  Alert,
} from '@mui/material';
import { PropertyDefinition, PropertyValue, DEFAULT_PRODUCT } from '@/types';

interface AddTankDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    product: string;
    location: string;
    currentVolume: number;
    properties: PropertyValue[];
  }) => Promise<void>;
  properties: PropertyDefinition[];
}

export default function AddTankDialog({
  open,
  onClose,
  onSubmit,
  properties,
}: AddTankDialogProps) {
  const [name, setName] = useState('');
  const [product, setProduct] = useState(DEFAULT_PRODUCT);
  const [location, setLocation] = useState('');
  const [volume, setVolume] = useState('');
  const [propertyValues, setPropertyValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Tank name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tankProperties: PropertyValue[] = properties.map((prop) => ({
        propertyId: prop.id,
        value: propertyValues[prop.id] ? parseFloat(propertyValues[prop.id]) : null,
      }));

      await onSubmit({
        name: name.trim(),
        product: product.trim() || DEFAULT_PRODUCT,
        location: location.trim(),
        currentVolume: parseFloat(volume) || 0,
        properties: tankProperties,
      });

      // Reset form
      setName('');
      setProduct(DEFAULT_PRODUCT);
      setLocation('');
      setVolume('');
      setPropertyValues({});
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tank');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyChange = (propertyId: string, value: string) => {
    setPropertyValues((prev) => ({
      ...prev,
      [propertyId]: value,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Tank</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          label="Tank Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
          required
        />

        <TextField
          label="Product"
          fullWidth
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          sx={{ mb: 2 }}
          helperText="Type of oil stored in this tank"
        />

        <TextField
          label="Location"
          fullWidth
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          sx={{ mb: 2 }}
          placeholder="e.g., Terminal A, Bay 3"
        />

        <TextField
          label="Initial Volume (KB)"
          type="number"
          fullWidth
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          sx={{ mb: 3 }}
          inputProps={{ min: 0, step: 0.1 }}
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Initial Properties (optional)
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {properties.map((prop) => (
            <TextField
              key={prop.id}
              label={`${prop.name} (${prop.unit})`}
              type="number"
              size="small"
              value={propertyValues[prop.id] || ''}
              onChange={(e) => handlePropertyChange(prop.id, e.target.value)}
              inputProps={{ step: 0.01 }}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Tank'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
