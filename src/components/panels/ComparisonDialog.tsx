import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
  Chip,
  Divider,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LabelList,
} from 'recharts';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { closeCompare, clearSelection } from '@/store/slices/historySlice';
import { HistoryEntry } from '@/store/slices/historySlice';

const BAR_COLORS = ['#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4', '#a855f7', '#ec4899', '#f97316'];

// Normalize metrics: handle both Record<string,number> (old) and array (new) formats
function toArray(metrics: unknown, totalSamples: number): { name: string; accuracy: number; samples: number }[] {
  if (Array.isArray(metrics)) return metrics as { name: string; accuracy: number; samples: number }[];
  if (metrics && typeof metrics === 'object') {
    return Object.entries(metrics as Record<string, number>).map(([name, accuracy]) => ({
      name, accuracy, samples: totalSamples,
    }));
  }
  return [];
}

export function ComparisonDialog() {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { entries, selectedIds, compareOpen } = useSelector((state: RootState) => state.history);

  const selected = entries.filter(e => selectedIds.includes(e.id)).map(e => ({
    ...e,
    summary: { ...e.summary, metrics: toArray(e.summary.metrics, e.summary.totalSamples) },
  }));
  if (selected.length < 2) return null;

  // ── Validation: same dataset + same attacks ──────────────
  const firstDataset = selected[0].summary.dataset;
  const allSameDataset = selected.every(e => e.summary.dataset === firstDataset);
  const firstAttacks = [...selected[0].summary.attacks].sort().join(',');
  const allSameAttacks = selected.every(e => [...e.summary.attacks].sort().join(',') === firstAttacks);
  const valid = allSameDataset && allSameAttacks;

  const handleClose = () => {
    dispatch(closeCompare());
    dispatch(clearSelection());
  };

  return (
    <Dialog open={compareOpen} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontSize: '0.95rem' }}>数据对比分析</DialogTitle>
      <DialogContent>
        {!valid ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography color="warning.main" sx={{ mb: 1, fontWeight: 600 }}>⚠️ 无法对比</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              对比需要所选记录具有<span style={{ fontWeight: 600 }}>相同的数据集</span>和<span style={{ fontWeight: 600 }}>相同的测试算法</span>。
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
              {selected.map((e, i) => (
                <Box key={e.id} sx={{
                  display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1,
                  borderRadius: 1, border: `1px solid ${theme.palette.divider}`,
                  minWidth: 320,
                }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: BAR_COLORS[i % BAR_COLORS.length], flexShrink: 0 }} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {e.summary.dataset} · {e.summary.model}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.25, mt: 0.25 }}>
                      {e.summary.attacks.map(a => (
                        <Chip key={a} label={a} size="small"
                          sx={{ height: 18, fontSize: '0.6rem',
                            backgroundColor: !allSameAttacks && !firstAttacks.includes(a) ? `${theme.palette.warning.main}33` : undefined,
                            color: !allSameAttacks && !firstAttacks.includes(a) ? 'warning.main' : undefined,
                          }} />
                      ))}
                    </Box>
                    {!allSameDataset && (
                      <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.6rem' }}>
                        数据集不一致: {e.summary.dataset} ≠ {firstDataset}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* ── Parameter summary ──────────────────────── */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label={`📦 ${firstDataset}`} size="small" variant="outlined" sx={{ height: 22 }} />
              <Chip label={`⚔️ ${firstAttacks}`} size="small" color="warning" variant="outlined" sx={{ height: 22 }} />
              {selected.map((e, i) => (
                <Chip key={e.id}
                  label={`${e.summary.model}${e.summary.defenses.length > 0 ? ' +🛡️' + e.summary.defenses.join(',') : ''}`}
                  size="small"
                  sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600,
                    backgroundColor: `${BAR_COLORS[i % BAR_COLORS.length]}22`,
                    color: BAR_COLORS[i % BAR_COLORS.length],
                  }}
                />
              ))}
            </Box>

            <Divider />

            {/* ── Side-by-side bar chart ─────────────────── */}
            <Box sx={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={selected[0].summary.attacks.map(atk => {
                    const row: Record<string, string | number> = { attack: atk };
                    selected.forEach((e, i) => {
                      const m = e.summary.metrics.find(m => m.name === atk);
                      row[`rec_${i}`] = m?.accuracy ?? 0;
                    });
                    return row;
                  })}
                  margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                  barCategoryGap="30%"
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="attack" tick={{ fontSize: 13, fontWeight: 600, fill: theme.palette.text.primary }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                      fontSize: '0.8rem',
                    }}
                    formatter={(value: unknown) => [`${(Number(value)).toFixed(1)}%`]}
                    labelFormatter={(label) => `攻击: ${label}`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '0.75rem', paddingTop: 10 }}
                    formatter={(value: string) => {
                      const i = parseInt(value.replace('rec_', ''));
                      const e = selected[i];
                      return `${e.summary.model}${e.summary.defenses.length > 0 ? ' + ' + e.summary.defenses.join(',') : ''}`;
                    }}
                  />
                  {selected.map((e, i) => (
                    <Bar
                      key={`rec_${i}`}
                      dataKey={`rec_${i}`}
                      name={`rec_${i}`}
                      fill={BAR_COLORS[i % BAR_COLORS.length]}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={60}
                    >
                      <LabelList
                        dataKey={`rec_${i}`}
                        position="top"
                        style={{ fontSize: 11, fontWeight: 700, fill: BAR_COLORS[i % BAR_COLORS.length] }}
                        formatter={(v: unknown) => `${(Number(v)).toFixed(1)}%`}
                      />
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Box>

            {/* ── Data table ─────────────────────────────── */}
            <Box sx={{ overflow: 'auto' }}>
              <Box component="table" sx={{
                width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem',
                '& th, & td': { px: 2, py: 1, textAlign: 'center', borderBottom: `1px solid ${theme.palette.divider}` },
                '& th': { fontWeight: 600, color: 'text.secondary', fontSize: '0.7rem' },
                '& td:first-of-type': { textAlign: 'left', fontWeight: 600 },
              }}>
                <thead>
                  <tr>
                    <th>攻击方法</th>
                    {selected.map((e, i) => (
                      <th key={e.id} style={{ color: BAR_COLORS[i % BAR_COLORS.length] }}>
                        {e.summary.model}
                        {e.summary.defenses.length > 0 && <><br /><span style={{ fontSize: '0.6rem', fontWeight: 400 }}>{e.summary.defenses.join(',')}</span></>}
                      </th>
                    ))}
                    <th style={{ color: 'text.disabled' }}>差异</th>
                  </tr>
                </thead>
                <tbody>
                  {selected[0].summary.attacks.map(atk => {
                    const values = selected.map(e => e.summary.metrics.find(m => m.name === atk)?.accuracy ?? 0);
                    const diff = Math.max(...values) - Math.min(...values);
                    return (
                      <tr key={atk}>
                        <td>{atk}</td>
                        {values.map((acc, i) => (
                          <td key={i} style={{
                            color: acc >= 80 ? '#22c55e' : acc >= 50 ? '#eab308' : acc >= 25 ? '#f97316' : '#ef4444',
                            fontWeight: 700,
                          }}>
                            {acc.toFixed(1)}%
                          </td>
                        ))}
                        <td style={{
                          color: diff > 10 ? '#ef4444' : diff > 3 ? '#f59e0b' : '#22c55e',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}>
                          {diff > 0 ? `${diff.toFixed(1)}%` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} size="small">关闭</Button>
      </DialogActions>
    </Dialog>
  );
}
