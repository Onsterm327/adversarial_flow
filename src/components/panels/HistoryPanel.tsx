import {
  Box,
  Typography,
  IconButton,
  Chip,
  Drawer,
  useTheme,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  DeleteOutline as ClearIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { toggleHistory, clearHistory } from '@/store/slices/historySlice';
import { HistoryEntry } from '@/store/slices/historySlice';

export function HistoryPanel() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { entries, open } = useSelector((state: RootState) => state.history);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={() => dispatch(toggleHistory())}
      PaperProps={{
        sx: {
          width: 380,
          background: theme.palette.background.paper,
          borderLeft: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <HistoryIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          执行历史
        </Typography>
        {entries.length > 0 && (
          <Button
            size="small"
            color="error"
            onClick={() => dispatch(clearHistory())}
            startIcon={<ClearIcon sx={{ fontSize: 14 }} />}
            sx={{ fontSize: '0.7rem', mr: 1 }}
          >
            清空
          </Button>
        )}
        <IconButton size="small" onClick={() => dispatch(toggleHistory())}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Entries */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
        {entries.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
            <Typography variant="body2">暂无执行记录</Typography>
            <Typography variant="caption">运行工作流后会自动记录</Typography>
          </Box>
        )}

        {entries.map(entry => (
          <HistoryEntryCard key={entry.id} entry={entry} />
        ))}
      </Box>
    </Drawer>
  );
}

function HistoryEntryCard({ entry }: { entry: HistoryEntry }) {
  const theme = useTheme();
  const time = new Date(entry.timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <Box
      sx={{
        mb: 1,
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* Timestamp + dataset/model */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
          {time}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Chip label={entry.summary.dataset} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
          <Chip label={entry.summary.model} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
        </Box>
      </Box>

      {/* Chain */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, mb: 0.75 }}>
        {entry.chain.map((item, i) => (
          <Chip
            key={i}
            label={item}
            size="small"
            variant="filled"
            sx={{
              height: 18,
              fontSize: '0.6rem',
              backgroundColor: theme.palette.action.hover,
            }}
          />
        ))}
      </Box>

      {/* Metrics */}
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        {entry.summary.metrics.map(m => {
          const color =
            m.accuracy >= 80 ? '#22c55e' :
            m.accuracy >= 50 ? '#eab308' :
            m.accuracy >= 25 ? '#f97316' : '#ef4444';
          return (
            <Box key={m.name} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', display: 'block' }}>
                {m.name}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700, color }}>
                {m.accuracy.toFixed(1)}%
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Defenses + samples */}
      <Box sx={{ mt: 0.75, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
          {entry.summary.defenses.length > 0 ? `🛡️ ${entry.summary.defenses.join(', ')}` : '无防御'}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
          {entry.summary.totalSamples} 样本
        </Typography>
      </Box>
    </Box>
  );
}
