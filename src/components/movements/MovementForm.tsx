'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Divider,
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Upload as UploadIcon } from '@mui/icons-material';
import { Tank, PropertyDefinition, PropertyValue, MovementType } from '@/types';
import { useUser } from '@/context/UserContext';
import { dataService } from '@/services/dataService';

interface MovementFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: MovementType;
    date: string | null;  // If set, movement is completed; if null, it's scheduled
    scheduledDate: string;
    expectedVolume: number;
    sourceTankId: string | null;
    destinationTankId: string | null;
    properties: PropertyValue[];
    carrier?: string;
    ticketNumber?: string;
    notes?: string;
    pdfPath?: string;
    createdBy: string;
  }) => Promise<void>;
  tanks: Tank[];
  properties: PropertyDefinition[];
  defaultTankId?: string;
}

export default function MovementForm({
  open,
  onClose,
  onSubmit,
  tanks,
  properties,
  defaultTankId,
}: MovementFormProps) {
  const { currentUser } = useUser();
  const [type, setType] = useState<MovementType>('receive');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(new Date());
  const [volume, setVolume] = useState('');
  const [sourceTankId, setSourceTankId] = useState<string>(
    type === 'ship' || type === 'transfer' ? defaultTankId || '' : ''
  );
  const [destinationTankId, setDestinationTankId] = useState<string>(
    type === 'receive' ? defaultTankId || '' : ''
  );
  const [carrier, setCarrier] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [propertyValues, setPropertyValues] = useState<Record<string, string>>({});
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<{
    volume?: number;
    properties: Array<{ name: string; value: number; unit?: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypeChange = (newType: MovementType) => {
    setType(newType);
    // Reset tank selections based on type
    if (newType === 'receive') {
      setSourceTankId('');
      setDestinationTankId(defaultTankId || '');
    } else if (newType === 'ship') {
      setSourceTankId(defaultTankId || '');
      setDestinationTankId('');
    } else {
      setSourceTankId(defaultTankId || '');
      setDestinationTankId('');
    }
  };

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
      if (extracted.volume) {
        setVolume(extracted.volume.toString());
      }

      // Auto-fill properties if extracted
      const newPropertyValues: Record<string, string> = {};
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
    if (!volume || parseFloat(volume) <= 0) {
      setError('Volume is required and must be greater than 0');
      return;
    }

    if (type === 'receive' && !destinationTankId) {
      setError('Destination tank is required for receiving');
      return;
    }

    if (type === 'ship' && !sourceTankId) {
      setError('Source tank is required for shipping');
      return;
    }

    if (type === 'transfer' && (!sourceTankId || !destinationTankId)) {
      setError('Both source and destination tanks are required for transfers');
      return;
    }

    if (type === 'transfer' && sourceTankId === destinationTankId) {
      setError('Source and destination tanks must be different');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let pdfPath: string | undefined;
      if (pdfFile) {
        const uploadResult = await dataService.pdf.upload(pdfFile);
        pdfPath = uploadResult.path;
      }

      const movementProperties: PropertyValue[] = properties.map((prop) => ({
        propertyId: prop.id,
        value: propertyValues[prop.id] ? parseFloat(propertyValues[prop.id]) : null,
      }));

      await onSubmit({
        type,
        date: isScheduled ? null : new Date().toISOString(),  // null = scheduled, set = completed
        scheduledDate: scheduledDate?.toISOString() || new Date().toISOString(),
        expectedVolume: parseFloat(volume),
        sourceTankId: type === 'receive' ? null : sourceTankId || null,
        destinationTankId: type === 'ship' ? null : destinationTankId || null,
        properties: movementProperties,
        carrier: carrier || undefined,
        ticketNumber: ticketNumber || undefined,
        notes: notes || undefined,
        pdfPath,
        createdBy: currentUser?.id || 'system',
      });

      // Reset form
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create movement');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType('receive');
    setIsScheduled(false);
    setScheduledDate(new Date());
    setVolume('');
    setSourceTankId('');
    setDestinationTankId('');
    setCarrier('');
    setTicketNumber('');
    setNotes('');
    setPropertyValues({});
    setPdfFile(null);
    setExtractedData(null);
    setError(null);
  };

  const handlePropertyChange = (propertyId: string, value: string) => {
    setPropertyValues((prev) => ({
      ...prev,
      [propertyId]: value,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Movement</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
          <InputLabel>Movement Type</InputLabel>
          <Select
            value={type}
            label="Movement Type"
            onChange={(e) => handleTypeChange(e.target.value as MovementType)}
          >
            <MenuItem value="receive">Receive (Into Tank)</MenuItem>
            <MenuItem value="ship">Ship (Out of Tank)</MenuItem>
            <MenuItem value="transfer">Transfer (Between Tanks)</MenuItem>
          </Select>
        </FormControl>

        {(type === 'ship' || type === 'transfer') && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Source Tank</InputLabel>
            <Select
              value={sourceTankId}
              label="Source Tank"
              onChange={(e) => setSourceTankId(e.target.value)}
            >
              {tanks.map((tank) => (
                <MenuItem key={tank.id} value={tank.id}>
                  {tank.name} ({tank.currentVolume.toFixed(1)} KB)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {(type === 'receive' || type === 'transfer') && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Destination Tank</InputLabel>
            <Select
              value={destinationTankId}
              label="Destination Tank"
              onChange={(e) => setDestinationTankId(e.target.value)}
            >
              {tanks
                .filter((t) => t.id !== sourceTankId)
                .map((tank) => (
                  <MenuItem key={tank.id} value={tank.id}>
                    {tank.name} ({tank.currentVolume.toFixed(1)} KB)
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        )}

        <TextField
          label="Expected Volume (KB)"
          type="number"
          fullWidth
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          sx={{ mb: 2 }}
          inputProps={{ min: 0, step: 0.1 }}
          required
        />

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
              />
            }
            label="Schedule for future date"
          />
        </Box>

        {isScheduled && (
          <DatePicker
            label="Scheduled Date"
            value={scheduledDate}
            onChange={(newValue) => setScheduledDate(newValue)}
            sx={{ mb: 2, width: '100%' }}
          />
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Optional Details
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Carrier"
            size="small"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Ticket Number"
            size="small"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            sx={{ flex: 1 }}
          />
        </Box>

        <TextField
          label="Notes"
          multiline
          rows={2}
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Analysis PDF (optional)
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadIcon />}
            disabled={extracting}
          >
            {extracting ? 'Extracting...' : pdfFile ? pdfFile.name : 'Upload PDF'}
            <input
              type="file"
              hidden
              accept=".pdf"
              onChange={handlePdfUpload}
            />
          </Button>
          {extractedData && (
            <Chip
              label="Data extracted"
              color="success"
              size="small"
              sx={{ ml: 1 }}
            />
          )}
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Analysis Properties
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
          disabled={loading || extracting}
        >
          {loading ? 'Saving...' : 'Add Movement'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
