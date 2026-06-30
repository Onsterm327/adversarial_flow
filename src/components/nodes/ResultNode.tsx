import { memo, useMemo } from 'react';
import { type NodeProps } from '@xyflow/react';
import {
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Assessment as ResultIcon,
  FiberManualRecord as LiveDot,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { NodeData, AttackMetric } from '@/types';
import { BaseNode } from './BaseNode';
import { MetricCard } from '@/components/shared/MetricCard';

export const ResultNode = memo(function ResultNode(props: NodeProps) {
  const theme = useTheme();
  const data = props.data as unknown as NodeData;
  const { isRunning, progress, metrics, totalSamples, error, summary } = useSelector(
    (state: RootState) => state.execution
  );

  // Sort metrics: Clean first, then by attack severity (FGSM > PGD > AutoAttack)
  const sortedMetrics = useMemo(() => {
    const order = ['Clean', 'FGSM', 'PGD', 'AutoAttack', 'CW', 'SQUARE'];
    return [...metrics].sort((a, b) => {
      const ai = order.indexOf(a.name);
      const bi = order.indexOf(b.name);
      if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [metrics]);

  return (
    <BaseNode
      {...props}
      hasTarget={true}
      hasSource={false}
      color="#ec4899"
      maxWidth={300}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 200 }}>
        {/* ── Running state: live metrics stream ─────────── */}
        {isRunning && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Live header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <LiveDot
                sx={{
                  fontSize: 10,
                  color: theme.palette.success.main,
                  animation: 'pulse 1.2s ease-in-out infinite',
                }}
              />
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: theme.palette.success.main, fontSize: '0.7rem' }}
              >
                实时评估中
              </Typography>
              <CircularProgress
                size={14}
                thickness={5}
                sx={{ color: theme.palette.primary.main, ml: 'auto' }}
              />
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.65rem' }}>
                {progress}%
              </Typography>
            </Box>

            {/* Per-attack live metrics */}
            {sortedMetrics.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {sortedMetrics.map(m => (
                  <LiveMetricRow key={m.name} metric={m} totalSamples={totalSamples || 1000} />
                ))}
              </Box>
            )}

            {/* Waiting for first metric */}
            {sortedMetrics.length === 0 && (
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', textAlign: 'center' }}>
                等待第一批评估结果...
              </Typography>
            )}
          </Box>
        )}

        {/* ── Completed state: final results ──────────────── */}
        {summary && !isRunning && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.success.main, fontSize: '0.7rem' }}>
                ✅ 评估完成
              </Typography>
            </Box>

            {/* Dataset + Model summary */}
            <Box
              sx={{
                display: 'flex',
                gap: 0.75,
                flexWrap: 'wrap',
              }}
            >
              <Chip
                label={summary.dataset}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.6rem', borderColor: theme.palette.divider }}
              />
              <Chip
                label={summary.model}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.6rem', borderColor: theme.palette.divider }}
              />
              {summary.defenses.length > 0 && (
                <Chip
                  label={`🛡️ ${summary.defenses.join(', ')}`}
                  size="small"
                  color="secondary"
                  variant="filled"
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
              )}
            </Box>

            {/* Final metric cards */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {summary.metrics.map(m => (
                <MetricCard key={m.name} name={m.name} accuracy={m.accuracy} compact />
              ))}
            </Box>

            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.55rem', textAlign: 'right' }}>
              总计 {summary.totalSamples.toLocaleString()} 样本
            </Typography>
          </Box>
        )}

        {/* ── Error state ──────────────────────────────────── */}
        {error && !isRunning && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center', py: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600, fontSize: '0.7rem', textAlign: 'center' }}>
              ❌ 执行失败
            </Typography>
            <Typography variant="caption" sx={{ color: 'error.light', fontSize: '0.6rem', textAlign: 'center', wordBreak: 'break-all' }}>
              {error}
            </Typography>
          </Box>
        )}

        {/* ── Idle state ───────────────────────────────────── */}
        {!isRunning && !summary && !error && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.75,
              py: 0.5,
            }}
          >
            <ResultIcon sx={{ fontSize: 28, color: 'text.disabled' }} />
            <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center', fontSize: '0.65rem' }}>
              连接模型节点后
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center', fontSize: '0.6rem' }}>
              点击顶部 ▶ 执行工作流
            </Typography>
          </Box>
        )}
      </Box>
    </BaseNode>
  );
});

// ── Per-metric live row with mini progress ────────────────────
function LiveMetricRow({ metric, totalSamples }: { metric: AttackMetric; totalSamples: number }) {
  const theme = useTheme();
  const batchProgress = Math.min(100, (metric.samples / totalSamples) * 100);

  const color = getAccuracyColor(metric.accuracy);

  return (
    <Box
      sx={{
        py: 0.4,
        px: 0.75,
        borderRadius: 1,
        backgroundColor: theme.palette.action.hover,
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      {/* Top row: name + accuracy */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.25 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem', color: 'text.primary' }}>
          {metric.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.25 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: '0.7rem',
              color,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {metric.accuracy.toFixed(1)}%
          </Typography>
        </Box>
      </Box>

      {/* Mini progress bar showing batch completion */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <LinearProgress
          variant="determinate"
          value={batchProgress}
          sx={{
            flex: 1,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: theme.palette.action.disabledBackground,
            '& .MuiLinearProgress-bar': {
              backgroundColor: color,
              borderRadius: 1.5,
              transition: 'transform 0.3s ease',
            },
          }}
        />
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.55rem', minWidth: 28, textAlign: 'right' }}>
          {metric.samples}/{totalSamples}
        </Typography>
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
