import { useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Drawer,
  useTheme,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  QueuePlayNext as QueueIcon,
  Delete as DeleteIcon,
  HourglassEmpty as WaitIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { setQueueState, toggleQueue } from '@/store/slices/queueSlice';
import { streamQueueStatus, cancelTask } from '@/api/queue';

export function QueuePanel() {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { current, items, open } = useSelector((state: RootState) => state.queue);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    cleanupRef.current = streamQueueStatus((state) => {
      dispatch(setQueueState(state));
    });
    return () => cleanupRef.current?.();
  }, [dispatch]);

  const handleCancel = async (id: string) => {
    await cancelTask(id);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={() => dispatch(toggleQueue())}
      PaperProps={{
        sx: {
          width: 340,
          background: theme.palette.background.paper,
          borderLeft: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <QueueIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
        <Typography variant="subtitle2" sx={{ flex: 1, fontSize: '0.75rem' }}>
          任务队列
        </Typography>
        <IconButton size="small" onClick={() => dispatch(toggleQueue())}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
        {/* Current task */}
        {current ? (
          <Box sx={{
            p: 1.5, mb: 1.5, borderRadius: 2,
            border: `1px solid ${theme.palette.primary.main}`,
            backgroundColor: theme.palette.action.hover,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <CircularProgress size={14} sx={{ color: 'primary.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                运行中
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
              {current.chain.slice(0, 8).map((c, i) => (
                <Chip key={i} label={c} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
              ))}
              {current.chain.length > 8 && (
                <Chip label={`+${current.chain.length - 8}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
              )}
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2, color: 'text.disabled' }}>
            <Typography variant="caption">队列空闲</Typography>
          </Box>
        )}

        {/* Waiting tasks */}
        {items.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              等待中 ({items.length})
            </Typography>
            {items.map(item => (
              <Box key={item.id} sx={{
                display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, mb: 0.5,
                borderRadius: 1, border: `1px solid ${theme.palette.divider}`,
              }}>
                <WaitIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                    #{item.position}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, mt: 0.25 }}>
                    {item.chain.slice(0, 5).map((c, i) => (
                      <Chip key={i} label={c} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
                    ))}
                  </Box>
                </Box>
                <IconButton size="small" onClick={() => handleCancel(item.id)} sx={{ opacity: 0.5 }}>
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        {!current && items.length === 0 && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center' }}>
            提交任务后将按顺序执行
          </Typography>
        )}
      </Box>
    </Drawer>
  );
}
