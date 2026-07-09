import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { adminService } from '../../../services/adminService';

type Props = {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
};

export function AdminDatasetUploadForm({ onSuccess, onError }: Props) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState('');

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile) {
        throw new Error('Choose a CSV file to upload');
      }
      return adminService.uploadTrainingDataset(
        selectedFile,
        name || selectedFile.name.replace(/\.csv$/i, ''),
        description,
      );
    },
    onSuccess: (result) => {
      setLocalError('');
      setSelectedFile(null);
      setName('');
      setDescription('');
      if (fileRef.current) fileRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['admin-training-datasets'] });
      onSuccess?.(result.message);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        (err instanceof Error ? err.message : 'Upload failed');
      setLocalError(msg);
      onError?.(msg);
    },
  });

  const pickFile = (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setLocalError('Only CSV files are supported');
      return;
    }
    setLocalError('');
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  };

  const canUpload = !!selectedFile && !uploadMutation.isPending;

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Dataset name"
          placeholder="e.g. Q1 2026 courier MIS export"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          size="small"
        />
        <TextField
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          size="small"
        />
      </Stack>

      <Box
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: dragOver ? 'primary.main' : 'divider',
          borderRadius: 2,
          bgcolor: dragOver ? 'rgba(79, 70, 229, 0.04)' : 'grey.50',
          py: 4,
          px: 2,
          textAlign: 'center',
          transition: 'border-color 0.15s, background-color 0.15s',
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Drop shipment MIS / training CSV here
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Platform-wide training data — pincode, courier, payment mode, weight, and delivery status columns are auto-detected.
          Minimum 100 rows with final <strong>Delivered</strong> or <strong>RTO</strong> outcomes.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" alignItems="center">
          <Button variant="contained" component="label" startIcon={<InsertDriveFileOutlinedIcon />}>
            Browse CSV
            <input
              ref={fileRef}
              hidden
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => adminService.downloadDatasetTemplate()}>
            Download template
          </Button>
        </Stack>
        {selectedFile && (
          <Typography variant="body2" color="primary.main" mt={2} fontWeight={500}>
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </Typography>
        )}
      </Box>

      {localError && <Alert severity="error">{localError}</Alert>}

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" size="large" disabled={!canUpload} onClick={() => uploadMutation.mutate()}>
          {uploadMutation.isPending ? 'Uploading & validating…' : 'Upload & validate'}
        </Button>
      </Stack>
    </Stack>
  );
}
