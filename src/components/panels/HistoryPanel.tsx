import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Drawer,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  DeleteOutline as ClearIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  BarChart as CompareIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { toggleHistory, deleteHistory, clearHistoryAsync, toggleSelect, clearSelection, openCompare } from '@/store/slices/historySlice';
import { HistoryEntry } from '@/store/slices/historySlice';
import { ComparisonDialog } from './ComparisonDialog';

// ── Chain item → color mapping ──────────────────────────────

const DATASET_NAMES = new Set(['CIFAR-10', 'CIFAR-100', 'ImageNet', 'STL']);
const MODEL_NAMES = new Set(['ResNet-18', 'WideResNet-28-10']);
const ATTACK_NAMES: Record<string, string> = {
  Clean: '#22c55e', PGD: '#ef4444', FGSM: '#f59e0b',
  AutoAttack: '#3b82f6', CW: '#a855f7', SQUARE: '#a855f7',
};
const DEFENSE_NAMES: Record<string, string> = {
  DiffPure: '#06b6d4', EBM: '#06b6d4', IEDN: '#06b6d4',
  'PGD-AT': '#10b981', TRADES: '#10b981',
  AHD: '#f97316',
  DWE: '#8b5cf6',
};

function getChipColor(item: string): string {
  if (DATASET_NAMES.has(item)) return '#3b82f6';
  if (MODEL_NAMES.has(item)) return '#22c55e';
  if (ATTACK_NAMES[item]) return ATTACK_NAMES[item];
  if (DEFENSE_NAMES[item]) return DEFENSE_NAMES[item];
  return '#64748b';
}

// ── Panel ────────────────────────────────────────────────────

export function HistoryPanel() {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { entries, open, selectedIds } = useSelector((state: RootState) => state.history);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleCompare = () => {
    if (selectedIds.length < 2) return;
    dispatch(openCompare());
  };

  return (
    <>
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
        {/* Header — title only */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            py: 0.75,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <HistoryIcon sx={{ fontSize: 17, color: 'text.secondary', mr: 0.75 }} />
          <Typography variant="subtitle2" sx={{ flex: 1, fontSize: '0.75rem' }}>
            执行历史 ({entries.length})
          </Typography>
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

        {/* Bottom action bar */}
        {entries.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              gap: 0.75,
              px: 1.5,
              py: 1,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Button
              size="small"
              color="primary"
              variant="contained"
              onClick={handleCompare}
              disabled={selectedIds.length < 2}
              startIcon={<CompareIcon sx={{ fontSize: 15 }} />}
              sx={{ fontSize: '0.7rem', flex: 1 }}
            >
              {selectedIds.length > 1 ? `对比 (${selectedIds.length})` : '勾选后对比'}
            </Button>
            {selectedIds.length > 0 && (
              <Button
                size="small"
                color="inherit"
                onClick={() => dispatch(clearSelection())}
                sx={{ fontSize: '0.7rem' }}
              >
                取消
              </Button>
            )}
            <Button
              size="small"
              color="error"
              onClick={() => setConfirmClear(true)}
              startIcon={<ClearIcon sx={{ fontSize: 15 }} />}
              sx={{ fontSize: '0.7rem' }}
            >
              清空
            </Button>
          </Box>
        )}
      </Drawer>

      {/* Confirm clear all dialog */}
      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)}>
        <DialogTitle sx={{ fontSize: '0.95rem' }}>确认清空</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            将删除全部 {entries.length} 条执行记录，此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClear(false)} size="small">取消</Button>
          <Button
            onClick={() => { dispatch(clearHistoryAsync()); setConfirmClear(false); }}
            color="error"
            size="small"
          >
            确认清空
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comparison chart dialog */}
      <ComparisonDialog />
    </>
  );
}

// ── Single entry card ────────────────────────────────────────

function HistoryEntryCard({ entry }: { entry: HistoryEntry }) {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selectedIds = useSelector((state: RootState) => state.history.selectedIds);
  const checked = selectedIds.includes(entry.id);

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
        position: 'relative',
      }}
    >
      {/* Delete button */}
      <IconButton
        size="small"
        onClick={() => setConfirmDelete(true)}
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          opacity: 0.4,
          '&:hover': { opacity: 1, color: theme.palette.error.main },
        }}
      >
        <DeleteIcon sx={{ fontSize: 14 }} />
      </IconButton>

      {/* Select checkbox */}
      <Checkbox
        checked={checked}
        onChange={() => dispatch(toggleSelect(entry.id))}
        size="small"
        sx={{
          position: 'absolute',
          top: 4,
          left: 4,
          p: 0.5,
          '& .MuiSvgIcon-root': { fontSize: 16 },
        }}
      />

      {/* Timestamp + dataset/model */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75, pr: 3, pl: 3 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
          {time}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Chip label={entry.summary.dataset} size="small" sx={{ height: 18, fontSize: '0.6rem', backgroundColor: '#3b82f644', color: '#3b82f6', fontWeight: 600 }} />
          <Chip label={entry.summary.model} size="small" sx={{ height: 18, fontSize: '0.6rem', backgroundColor: '#22c55e44', color: '#22c55e', fontWeight: 600 }} />
        </Box>
      </Box>

      {/* Chain with colored chips */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, mb: 0.75, pr: 3, pl: 3 }}>
        {entry.chain.map((item, i) => {
          const color = getChipColor(item);
          return (
            <Chip
              key={i}
              label={item}
              size="small"
              variant="filled"
              sx={{
                height: 18,
                fontSize: '0.6rem',
                fontWeight: 500,
                backgroundColor: `${color}33`,
                color,
              }}
            />
          );
        })}
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

      {/* Confirm delete dialog */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle sx={{ fontSize: '0.95rem' }}>确认删除</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            删除这条执行记录？
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.disabled">{time}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, mt: 0.5 }}>
              {entry.summary.metrics.map(m => (
                <Chip key={m.name} label={`${m.name} ${m.accuracy.toFixed(1)}%`} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} size="small">取消</Button>
          <Button
            onClick={() => { dispatch(deleteHistory(entry.id)); setConfirmDelete(false); }}
            color="error"
            size="small"
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
