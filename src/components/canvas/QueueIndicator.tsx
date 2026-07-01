import { useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Chip, useTheme } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { setQueueState } from '@/store/slices/queueSlice';
import { streamQueueStatus } from '@/api/queue';

export function QueueIndicator() {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { current, items } = useSelector((state: RootState) => state.queue);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    cleanupRef.current = streamQueueStatus((state) => {
      dispatch(setQueueState(state));
    });
    return () => cleanupRef.current?.();
  }, [dispatch]);

  const total = (current ? 1 : 0) + items.length;
  if (total === 0) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      {current && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.primary.main}`,
            boxShadow: theme.shadows[4],
          }}
        >
          <CircularProgress size={12} sx={{ color: 'primary.main' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', fontSize: '0.65rem' }}>
            运行中
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            {current.chain.slice(0, 4).map((c, i) => (
              <Chip key={i} label={c} size="small" sx={{ height: 16, fontSize: '0.55rem' }} />
            ))}
          </Box>
        </Box>
      )}
      {items.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[4],
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.65rem' }}>
            队列 {items.length}
          </Typography>
          {items.slice(0, 3).map((item, i) => (
            <Chip key={i} label={`#${item.position}`} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.55rem' }} />
          ))}
          {items.length > 3 && (
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
              +{items.length - 3}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
