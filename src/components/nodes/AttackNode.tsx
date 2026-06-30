import { memo, useState } from 'react';
import { type NodeProps } from '@xyflow/react';
import {
  Chip,
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as RemoveIcon,
  GpsFixed as AttackIcon,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { NodeData } from '@/types';
import { BaseNode } from './BaseNode';
import { updateNodeData } from '@/store/slices/flowSlice';

const ATTACK_COLORS: Record<string, 'success' | 'error' | 'warning' | 'info' | 'secondary'> = {
  Clean: 'success',
  PGD: 'error',
  FGSM: 'warning',
  AutoAttack: 'info',
  CW: 'secondary',
  SQUARE: 'secondary',
};

export const AttackNode = memo(function AttackNode(props: NodeProps) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const data = props.data as unknown as NodeData;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const selectedAttacks = data.selectedAttacks || ['Clean'];
  const availableAttacks = data.availableAttacks || [];
  const unselectedAttacks = availableAttacks.filter(a => !selectedAttacks.includes(a));

  const handleAddAttack = (attack: string) => {
    dispatch(
      updateNodeData({
        nodeId: props.id,
        data: { selectedAttacks: [...selectedAttacks, attack] },
      })
    );
    setAnchorEl(null);
  };

  const handleRemoveAttack = (attack: string) => {
    if (attack === 'Clean') return; // Cannot remove Clean baseline
    dispatch(
      updateNodeData({
        nodeId: props.id,
        data: { selectedAttacks: selectedAttacks.filter(a => a !== attack) },
      })
    );
  };

  return (
    <BaseNode {...props} hasTarget={true} hasSource={true} color="#f59e0b">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {/* Attack tags */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selectedAttacks.map(attack => (
            <Chip
              key={attack}
              label={attack}
              size="small"
              color={ATTACK_COLORS[attack] || 'default'}
              variant="filled"
              onDelete={attack !== 'Clean' ? () => handleRemoveAttack(attack) : undefined}
              deleteIcon={<RemoveIcon sx={{ fontSize: 12 }} />}
              icon={<AttackIcon sx={{ fontSize: 12 }} />}
              sx={{
                height: 22,
                fontSize: '0.65rem',
                fontWeight: 500,
                '& .MuiChip-deleteIcon': {
                  color: 'inherit',
                  '&:hover': { opacity: 0.7 },
                },
              }}
            />
          ))}

          {/* Add attack button */}
          {unselectedAttacks.length > 0 && (
            <>
              <Chip
                label="+"
                size="small"
                variant="outlined"
                onClick={e => setAnchorEl(e.currentTarget as any)}
                sx={{
                  height: 22,
                  minWidth: 28,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  borderStyle: 'dashed',
                }}
              />
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                slotProps={{ paper: { sx: { minWidth: 140, fontSize: '0.75rem' } } }}
              >
                <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.secondary', display: 'block' }}>
                  添加攻击方法
                </Typography>
                {unselectedAttacks.map(attack => (
                  <MenuItem key={attack} onClick={() => handleAddAttack(attack)} dense>
                    <ListItemIcon>
                      <AddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: '0.8rem' }}>
                      {attack}
                    </ListItemText>
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Box>

      </Box>
    </BaseNode>
  );
});
