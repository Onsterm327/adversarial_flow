import { Box, Typography, LinearProgress, useTheme } from '@mui/material';

interface Props {
  name: string;
  accuracy: number;
  compact?: boolean;
}

function getColor(accuracy: number): string {
  if (accuracy >= 80) return '#22c55e';
  if (accuracy >= 50) return '#eab308';
  if (accuracy >= 25) return '#f97316';
  return '#ef4444';
}

export function MetricCard({ name, accuracy, compact }: Props) {
  const theme = useTheme();
  const color = getColor(accuracy);

  if (compact) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          py: 0.25,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            minWidth: compact ? 55 : 70,
            fontSize: '0.65rem',
          }}
        >
          {name}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={accuracy}
          sx={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.palette.action.disabledBackground,
            '& .MuiLinearProgress-bar': {
              backgroundColor: color,
              borderRadius: 2,
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color,
            minWidth: 40,
            textAlign: 'right',
            fontSize: '0.65rem',
          }}
        >
          {accuracy.toFixed(1)}%
        </Typography>
      </Box>
    );
  }

  // Full size metric card
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {name}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color,
            fontSize: '1.1rem',
          }}
        >
          {accuracy.toFixed(1)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={accuracy}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: theme.palette.action.disabledBackground,
          '& .MuiLinearProgress-bar': {
            backgroundColor: color,
            borderRadius: 3,
          },
        }}
      />
    </Box>
  );
}
