import { Box, Typography, Chip, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Add as AddIcon, Close as RemoveIcon, GpsFixed as AttackIcon } from '@mui/icons-material';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { NodeData } from '@/types';
import { updateNodeData } from '@/store/slices/flowSlice';

const ATTACK_COLORS: Record<string, 'success' | 'error' | 'warning' | 'info' | 'secondary'> = {
  Clean: 'success',
  PGD: 'error',
  FGSM: 'warning',
  AutoAttack: 'info',
  CW: 'secondary',
  SQUARE: 'secondary',
};

interface Props {
  nodeId: string;
  data: NodeData;
}

export function AttackConfig({ nodeId, data }: Props) {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const selectedAttacks = data.selectedAttacks || ['Clean'];
  const availableAttacks = data.availableAttacks || [];
  const unselected = availableAttacks.filter(a => !selectedAttacks.includes(a));

  const handleAdd = (attack: string) => {
    dispatch(
      updateNodeData({
        nodeId,
        data: { selectedAttacks: [...selectedAttacks, attack] },
      })
    );
    setAnchorEl(null);
  };

  const handleRemove = (attack: string) => {
    if (attack === 'Clean') return;
    dispatch(
      updateNodeData({
        nodeId,
        data: { selectedAttacks: selectedAttacks.filter(a => a !== attack) },
      })
    );
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
        攻击方法 ({selectedAttacks.length})
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {selectedAttacks.map(attack => (
          <Chip
            key={attack}
            label={attack}
            size="small"
            color={ATTACK_COLORS[attack] || 'default'}
            variant="filled"
            onDelete={attack !== 'Clean' ? () => handleRemove(attack) : undefined}
            deleteIcon={<RemoveIcon sx={{ fontSize: 12 }} />}
            icon={<AttackIcon sx={{ fontSize: 12 }} />}
            sx={{
              height: 24,
              fontSize: '0.7rem',
              '& .MuiChip-deleteIcon': {
                color: 'inherit',
                '&:hover': { opacity: 0.7 },
              },
            }}
          />
        ))}
        {unselected.length > 0 && (
          <>
            <Chip
              label="+ 添加"
              size="small"
              variant="outlined"
              onClick={e => setAnchorEl(e.currentTarget as any)}
              sx={{ height: 24, fontSize: '0.65rem', borderStyle: 'dashed', cursor: 'pointer' }}
            />
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              slotProps={{ paper: { sx: { minWidth: 140 } } }}
            >
              <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.secondary', display: 'block' }}>
                添加攻击方法
              </Typography>
              {unselected.map(attack => (
                <MenuItem key={attack} onClick={() => handleAdd(attack)} dense>
                  <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primaryTypographyProps={{ fontSize: '0.8rem' }}>{attack}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </Box>
    </Box>
  );
}
