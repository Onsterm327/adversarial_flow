import { useMemo } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  FiberManualRecord as LiveDot,
  CheckCircle as DoneIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const METRIC_ORDER = ['Clean', 'FGSM', 'PGD', 'AutoAttack', 'CW', 'SQUARE'];

export function BottomBar() {
  const theme = useTheme();
  const { isRunning, progress, currentStep, metrics, totalSamples, error, summary } = useSelector(
    (state: RootState) => state.execution
  );
  const { nodes, edges } = useSelector((state: RootState) => state.flow);

  // Sorted metrics for mini progress bars
  const sortedMetrics = useMemo(() => {
    return [...metrics].sort((a, b) => {
      const ai = METRIC_ORDER.indexOf(a.name);
      const bi = METRIC_ORDER.indexOf(b.name);
      if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [metrics]);

  const maxSamples = totalSamples || 1000; // from backend SSE, fallback 1000

  return (
    <Box
      sx={{
        height: 36,
        display: 'flex',
        alignItems: 'center',
        px: 2,
        gap: 1.5,
        background: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* ── Status indicator ──────────────────────────────── */}
      {isRunning ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <LiveDot
            sx={{
              fontSize: 8,
              color: theme.palette.success.main,
              animation: 'pulse 1.2s ease-in-out infinite',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: theme.palette.success.main,
              whiteSpace: 'nowrap',
              fontSize: '0.7rem',
            }}
          >
            LIVE
          </Typography>
        </Box>
      ) : error ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ErrorIcon sx={{ fontSize: 14, color: theme.palette.error.main }} />
          <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600, fontSize: '0.7rem' }}>
            错误
          </Typography>
        </Box>
      ) : summary ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <DoneIcon sx={{ fontSize: 14, color: theme.palette.success.main }} />
          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.7rem' }}>
            完成
          </Typography>
        </Box>
      ) : (
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
          就绪
        </Typography>
      )}

      {/* ── Progress bar ──────────────────────────────────── */}
      {isRunning && (
        <>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              flex: 1,
              maxWidth: 180,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.palette.action.disabledBackground,
              '& .MuiLinearProgress-bar': {
                transition: 'transform 0.4s ease',
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              whiteSpace: 'nowrap',
              maxWidth: 280,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.65rem',
            }}
          >
            {currentStep}
          </Typography>
        </>
      )}

      {error && (
        <Typography
          variant="caption"
          sx={{
            color: 'error.light',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '0.65rem',
          }}
        >
          {error}
        </Typography>
      )}

      {/* ── Spacer ────────────────────────────────────────── */}
      <Box sx={{ flex: 1 }} />

      {/* ── Per-attack mini progress (only during execution) ─ */}
      {isRunning && sortedMetrics.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {sortedMetrics.map(m => (
            <Tooltip
              key={m.name}
              title={`${m.name}: ${m.accuracy.toFixed(1)}% (${m.samples}/${maxSamples} 样本)`}
              arrow
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, color: 'text.secondary', minWidth: 28 }}>
                  {m.name.length > 4 ? m.name.slice(0, 4) : m.name}
                </Typography>
                <Box
                  sx={{
                    width: 40,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: theme.palette.action.disabledBackground,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${Math.min(100, (m.samples / maxSamples) * 100)}%`,
                      borderRadius: 3,
                      backgroundColor: getAccuracyColor(m.accuracy),
                      transition: 'width 0.3s ease, background-color 0.3s ease',
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    color: getAccuracyColor(m.accuracy),
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 36,
                    transition: 'color 0.3s ease',
                  }}
                >
                  {m.accuracy.toFixed(1)}%
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Box>
      )}

      {/* ── Completed summary (compact) ────────────────────── */}
      {summary && !isRunning && sortedMetrics.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {sortedMetrics.map(m => (
            <Box key={m.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, color: 'text.secondary' }}>
                {m.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: getAccuracyColor(m.accuracy),
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {m.accuracy.toFixed(1)}%
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* ── Node/edge counts ───────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
        <Chip
          label={`${nodes.length}N`}
          size="small"
          variant="outlined"
          sx={{ height: 18, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }}
        />
        <Chip
          label={`${edges.length}E`}
          size="small"
          variant="outlined"
          sx={{ height: 18, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }}
        />
      </Box>
    </Box>
  );
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return '#22c55e';
  if (accuracy >= 50) return '#eab308';
  if (accuracy >= 25) return '#f97316';
  return '#ef4444';
}
