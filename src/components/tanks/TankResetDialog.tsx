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
  Chip,
  CircularProgress,
} from '@mui/material';
import { Upload as UploadIcon, Check as CheckIcon } from '@mui/icons-material';
import { Tank, PropertyDefinition, PropertyValue } from '@/types';
import { dataService } from '@/services/dataService';

interface TankResetDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (volume: number, properties: PropertyValue[]) => Promise<void>;
  tank: Tank;
  properties: PropertyDefinition[];
}

export default function TankResetDialog({
  open,
  onClose,
  onSubmit,
  tank,
  properties,
}: TankResetDialogProps) {
  const [volume, setVolume] = useState(tank.currentVolume.toString());
  const [propertyValues, setPropertyValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    tank.properties.forEach((p) => {
      if (p.value !== null) {
        initial[p.propertyId] = p.value.toString();
      }
    });
    return initial;
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<{
    volume?: number;
    properties: Array<{ name: string; value: number; unit?: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPdfFile(file);
    setExtracting(true);
    setError(null);

    try {
      const extracted = await dataService.pdf.extract(file);
      setExtractedData(extracted);

      // Auto-fill volume if extracted
      if (extracted.volume !== undefined) {
        setVolume(extracted.volume.toString());
      }

      // Auto-fill properties if extracted
      const newPropertyValues: Record<string, string> = { ...propertyValues };
      extracted.properties.forEach((prop) => {
        const matchingProp = properties.find(
          (p) => p.name.toLowerCase() === prop.name.toLowerCase()
        );
        if (matchingProp) {
          newPropertyValues[matchingProp.id] = prop.value.toString();
        }
      });
      setPropertyValues(newPropertyValues);
    } catch (err) {
      console.error('PDF extraction failed:', err);
      setError('Failed to extract data from PDF. You can still enter values manually.');
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async () => {
    if (!volume || parseFloat(volume) < 0) {
      setError('Valid volume is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resetProperties: PropertyValue[] = properties.map((prop) => ({
        propertyId: prop.id,
        value: propertyValues[prop.id] ? parseFloat(propertyValues[prop.id]) : null,
      }));

      await onSubmit(parseFloat(volume), resetProperties);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset tank');
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
      <DialogTitle>Reset Tank Values - {tank.name}</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Upload a PDF analysis report to automatically extract values, or enter them manually.
          This will reset the tank to match physical measurements.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={extracting ? <CircularProgress size={20} /> : <UploadIcon />}
            disabled={extracting}
            fullWidth
          >
            {extracting
              ? 'Extracting data...'
              : pdfFile
              ? pdfFile.name
              : 'Upload Analysis PDF'}
            <input
              type="file"
              hidden
              accept=".pdf"
              onChange={handlePdfUpload}
            />
          </Button>
          {extractedData && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon color="success" fontSize="small" />
              <Typography variant="body2" color="success.main">
                Data extracted successfully
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <TextField
          label="Volume (KB)"
          type="number"
          fullWidth
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          sx={{ mb: 3 }}
          inputProps={{ min: 0, step: 0.1 }}
          required
        />

        <Typography variant="subtitle2" gutterBottom>
          Properties
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
          color="warning"
          disabled={loading || extracting}
        >
          {loading ? 'Resetting...' : 'Reset Tank Values'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
