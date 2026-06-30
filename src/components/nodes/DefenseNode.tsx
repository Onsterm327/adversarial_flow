import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Chip, Box, Typography, Slider, useTheme } from '@mui/material';
import { Security as DefenseIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { NodeData } from '@/types';
import { BaseNode } from './BaseNode';
import { updateNodeData } from '@/store/slices/flowSlice';

const subtypeLabels: Record<string, string> = {
  input_reconstruction: '输入重构',
  adversarial_training: '对抗训练',
  active_defense: '主动防御',
  ensemble_defense: '集成防御',
};

const subtypeColors: Record<string, 'info' | 'success' | 'warning' | 'secondary'> = {
  input_reconstruction: 'info',
  adversarial_training: 'success',
  active_defense: 'warning',
  ensemble_defense: 'secondary',
};

export const DefenseNode = memo(function DefenseNode(props: NodeProps) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const data = props.data as unknown as NodeData;
  const subtype = data.defenseSubtype || 'input_reconstruction';

  // Determine handle visibility
  const hasTarget = subtype === 'input_reconstruction';
  const hasSource = true; // all defense types can output

  const isDWE = data.cardId === 'dwe';
  const atkValue = (data.defenseParams?.atk as number) || 1;

  const handleAtkChange = (_event: Event, value: number | number[]) => {
    dispatch(
      updateNodeData({
        nodeId: props.id,
        data: { defenseParams: { atk: value as number } },
      })
    );
  };

  return (
    <BaseNode {...props} hasTarget={hasTarget} hasSource={hasSource}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Chip
            icon={<DefenseIcon sx={{ fontSize: 14 }} />}
            label={data.label}
            size="small"
            variant="outlined"
            color={subtypeColors[subtype] || 'secondary'}
            sx={{ height: 24, fontSize: '0.7rem' }}
          />
          <Chip
            label={subtypeLabels[subtype] || subtype}
            size="small"
            color={subtypeColors[subtype] || 'default'}
            variant="filled"
            sx={{ height: 20, fontSize: '0.6rem', fontWeight: 500 }}
          />
        </Box>

        {/* DWE slider */}
        {isDWE && (
          <Box sx={{ px: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                ATK 参数
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'secondary.main', fontSize: '0.65rem' }}>
                {atkValue}
              </Typography>
            </Box>
            <Slider
              value={atkValue}
              onChange={handleAtkChange}
              min={1}
              max={5}
              step={1}
              size="small"
              sx={{
                py: 0,
                '& .MuiSlider-thumb': { width: 12, height: 12 },
                '& .MuiSlider-track': { height: 3 },
                '& .MuiSlider-rail': { height: 3 },
              }}
            />
          </Box>
        )}

      </Box>
    </BaseNode>
  );
});
