import { Chip } from '@mui/material';
import { RiskLevel } from '../types/api.types';

const COLORS: Record<RiskLevel, 'success' | 'warning' | 'error' | 'default'> = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'error',
  CRITICAL: 'error',
};

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  return (
    <Chip
      label={score != null ? `${level} (${score})` : level}
      color={COLORS[level]}
      size="small"
      sx={{ fontWeight: 600 }}
    />
  );
}
