import { memo, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { type NodeProps, useReactFlow } from '@xyflow/react';
import {
  Box, Typography, CircularProgress, LinearProgress, Chip,
  useTheme, Button,
} from '@mui/material';
import {
  Assessment as ResultIcon, FiberManualRecord as LiveDot,
  PlayArrow as PlayIcon, Stop as StopIcon,
} from '@mui/icons-material';
import { NodeData, AttackMetric, ExecutionSummary } from '@/types';
import { BaseNode } from './BaseNode';
import { MetricCard } from '@/components/shared/MetricCard';
import { submitToQueue, streamTaskProgress } from '@/api/queue';
import { executePipeline, mockExecute } from '@/api/execute';
import { saveHistory } from '@/store/slices/historySlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';

export const ResultNode = memo(function ResultNode(props: NodeProps) {
  const theme = useTheme();
  const data = props.data as unknown as NodeData;
  const dispatch = useDispatch<AppDispatch>();
  const { getNodes, getEdges } = useReactFlow();

  // ── Local execution state ────────────────────────────
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [metrics, setMetrics] = useState<AttackMetric[]>([]);
  const [totalSamples, setTotalSamples] = useState(1000);
  const [startTime, setStartTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ExecutionSummary | null>(null);
  const [tick, setTick] = useState(0);
  const timingStartedRef = useRef(false);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);
  void tick;

  // Start timing only when first real data arrives (totalSamples known)
  const effectiveStart = timingStartedRef.current ? startTime : 0;
  const elapsedSec = isRunning && effectiveStart ? Math.max(0, (Date.now() - effectiveStart) / 1000) : 0;
  const processedSamples = metrics.length > 0 ? Math.max(...metrics.map(m => m.samples)) : 0;
  const throughput = processedSamples > 0 && elapsedSec > 0 ? processedSamples / elapsedSec : 0;
  const remainingSamples = Math.max(0, totalSamples - processedSamples);
  const remainingSec = throughput > 0 ? remainingSamples / throughput : 0;

  // ── Chain builder ────────────────────────────────────
  const buildChain = useCallback((): { chain: string[]; defenseParams: Record<string, unknown> } => {
    const allNodes = getNodes();
    const allEdges = getEdges();

    const reverseAdj = new Map<string, string[]>();
    for (const e of allEdges) {
      if (!reverseAdj.has(e.target)) reverseAdj.set(e.target, []);
      reverseAdj.get(e.target)!.push(e.source);
    }

    const collected = new Set<string>();
    const queue: string[] = [props.id];
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (collected.has(nodeId)) continue;
      collected.add(nodeId);
      for (const parent of (reverseAdj.get(nodeId) || [])) {
        if (!collected.has(parent)) queue.push(parent);
      }
    }

    const chain: string[] = [];
    const defenseParams: Record<string, unknown> = {};
    for (const nodeId of collected) {
      if (nodeId === props.id) continue;
      const node = allNodes.find(n => n.id === nodeId);
      if (!node) continue;
      const nd = node.data as unknown as NodeData;
      if (nd.category === 'attack') {
        chain.push(...(nd.selectedAttacks || []));
      } else {
        chain.push(nd.label);
        if (nd.category === 'defense' && nd.defenseParams && Object.keys(nd.defenseParams).length > 0) {
          defenseParams[nd.label] = nd.defenseParams;
        }
      }
    }
    return { chain, defenseParams };
  }, [props.id, getNodes, getEdges]);

  // ── Execute handler ──────────────────────────────────
  const stopRef = useRef<(() => void) | null>(null);
  const taskIdRef = useRef<string | null>(null);

  const handleExecute = useCallback(async () => {
    if (isRunning) {
      // Actually stop: abort SSE + notify backend + reset UI
      if (stopRef.current) { stopRef.current(); stopRef.current = null; }
      const API = import.meta.env.VITE_API_URL || 'http://localhost:8765';
      fetch(`${API}/api/queue/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: taskIdRef.current }),
      }).catch(() => {});
      taskIdRef.current = null;
      setIsRunning(false);
      return;
    }

    const { chain, defenseParams } = buildChain();
    if (chain.length === 0) { setError('未连接到任何链路'); return; }

    setIsRunning(true);
    setProgress(0);
    setCurrentStep('初始化...');
    setMetrics([]);
    setTotalSamples(1000);
    setStartTime(0);
    timingStartedRef.current = false;
    setError(null);
    setSummary(null);

    const callbacks = {
      onStep: (msg: string, pct: number) => {
        setCurrentStep(msg);
        setProgress(p => Math.max(p, pct));
      },
      onMetric: (m: AttackMetric, ts: number) => {
        if (!timingStartedRef.current && ts > 0) {
          timingStartedRef.current = true;
          setStartTime(Date.now());
        }
        setMetrics(prev => {
          const idx = prev.findIndex(x => x.name === m.name);
          if (idx >= 0) { const next = [...prev]; next[idx] = m; return next; }
          return [...prev, m];
        });
        if (ts > 0) setTotalSamples(ts);
      },
      onResult: (s: ExecutionSummary) => {
        setSummary(s);
        setIsRunning(false);
        stopRef.current = null;
        taskIdRef.current = null;
        dispatch(saveHistory({ chain: [...chain], summary: s }));
      },
      onError: (err: string) => {
        setError(err);
        setIsRunning(false);
        stopRef.current = null;
        taskIdRef.current = null;
      },
    };

    try {
      const taskId = await submitToQueue(chain, defenseParams);
      if (taskId) {
        taskIdRef.current = taskId;
        stopRef.current = streamTaskProgress(taskId, {
          onStep: callbacks.onStep,
          onMetric: (name, acc, samples, ts) => callbacks.onMetric({ name, accuracy: acc, samples }, ts),
          onResult: (s) => { callbacks.onResult(s as unknown as ExecutionSummary); stopRef.current = null; taskIdRef.current = null; },
          onError: (err) => { callbacks.onError(err); stopRef.current = null; taskIdRef.current = null; },
        });
      } else {
        await executePipeline(chain, defenseParams, callbacks);
      }
    } catch {
      try {
        await executePipeline(chain, defenseParams, callbacks);
      } catch (err) {
        console.warn('后端不可用，模拟模式');
        setIsRunning(false);
        setStartTime(Date.now());
        setIsRunning(true);
        mockExecute(chain, callbacks);
      }
    }
  }, [isRunning, buildChain, dispatch]);

  // ── Sorted metrics ───────────────────────────────────
  const sortedMetrics = useMemo(() => {
    const order = ['Clean', 'FGSM', 'PGD', 'AutoAttack', 'CW', 'SQUARE'];
    return [...metrics].sort((a, b) => {
      const ai = order.indexOf(a.name), bi = order.indexOf(b.name);
      if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
      if (ai === -1) return 1; if (bi === -1) return -1;
      return ai - bi;
    });
  }, [metrics]);

  return (
    <BaseNode {...props} hasTarget={true} hasSource={false} color="#ec4899" maxWidth={300}
      minWidth={260}
      headerRight={
        <Button
          size="small" variant="contained"
          onClick={handleExecute}
          startIcon={isRunning ? <StopIcon sx={{ fontSize: 12 }} /> : <PlayIcon sx={{ fontSize: 12 }} />}
          sx={{
            fontSize: '0.6rem', py: 0.2, px: 1, minWidth: 0, borderRadius: 1.5,
            backgroundColor: isRunning ? theme.palette.error.main : theme.palette.primary.main,
            '&:hover': { backgroundColor: isRunning ? theme.palette.error.dark : theme.palette.primary.dark },
          }}
        >
          {isRunning ? '停止' : '执行'}
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

        {/* ── Running state ─────────────────────── */}
        {isRunning && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <LiveDot sx={{ fontSize: 10, color: 'success.main', animation: 'pulse 1.2s ease-in-out infinite' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main', fontSize: '0.7rem' }}>
                实时评估中
              </Typography>
              <CircularProgress size={14} thickness={5} sx={{ color: 'primary.main', ml: 'auto' }} />
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.65rem' }}>{progress}%</Typography>
            </Box>
            {elapsedSec > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem' }}>⏱ {formatTime(elapsedSec)}</Typography>
                {remainingSec > 0 && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>剩余 ~{formatTime(remainingSec)}</Typography>
                )}
              </Box>
            )}
            {/* Shared sample progress bar */}
            {totalSamples > 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.disabled' }}>样本进度</Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.disabled' }}>{processedSamples}/{totalSamples}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (processedSamples / totalSamples) * 100)}
                  sx={{ height: 4, borderRadius: 2, backgroundColor: theme.palette.action.disabledBackground,
                    '& .MuiLinearProgress-bar': { borderRadius: 2, transition: 'transform 0.3s ease' } }}
                />
              </Box>
            )}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 0.5, alignItems: 'center' }}>
              {sortedMetrics.map(m => {
                const color = m.accuracy >= 80 ? '#22c55e' : m.accuracy >= 50 ? '#eab308' : m.accuracy >= 25 ? '#f97316' : '#ef4444';
                return (
                  <Box key={m.name} sx={{ display: 'contents' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.6rem', color: 'text.primary' }}>{m.name}</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={m.accuracy}
                      sx={{ height: 4, borderRadius: 2, backgroundColor: theme.palette.action.disabledBackground,
                        '& .MuiLinearProgress-bar': { backgroundColor: color, borderRadius: 2, transition: 'transform 0.3s ease' } }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', color, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{m.accuracy.toFixed(1)}%</Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* ── Completed state ──────────────────── */}
        {summary && !isRunning && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main', fontSize: '0.7rem' }}>✅ 评估完成</Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              <Chip label={summary.dataset} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />
              <Chip label={summary.model} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />
              {summary.defenses.length > 0 && (
                <Chip label={`🛡️ ${summary.defenses.join(', ')}`} size="small" color="secondary" variant="filled" sx={{ height: 20, fontSize: '0.6rem' }} />
              )}
            </Box>
            {summary.metrics.map(m => (<MetricCard key={m.name} name={m.name} accuracy={m.accuracy} compact />))}
          </Box>
        )}

        {/* ── Error ───────────────────────────── */}
        {error && !isRunning && (
          <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600, fontSize: '0.7rem', textAlign: 'center' }}>
            ❌ {error}
          </Typography>
        )}

        {/* ── Idle ────────────────────────────── */}
        {!isRunning && !summary && !error && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, py: 0.5 }}>
            <ResultIcon sx={{ fontSize: 28, color: 'text.disabled' }} />
            <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center', fontSize: '0.65rem' }}>
              连接节点后点击执行
            </Typography>
          </Box>
        )}
      </Box>
    </BaseNode>
  );
});

function formatTime(sec: number): string {
  if (sec < 1) return '0s';
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return m > 0 ? `${m}m${s}s` : `${s}s`;
}
