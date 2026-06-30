import { Box, Typography, Slider, Chip } from '@mui/material';
import { Security as DefenseIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { NodeData } from '@/types';
import { updateNodeData } from '@/store/slices/flowSlice';

const subtypeLabels: Record<string, string> = {
  input_reconstruction: '输入重构 — 净化对抗噪声后再输入模型',
  adversarial_training: '对抗训练 — 增强模型内在鲁棒性',
  active_defense: '主动防御 — 代理模型欺骗攻击者',
  ensemble_defense: '集成防御 — 多模型投票增强稳定性',
};

interface Props {
  nodeId: string;
  data: NodeData;
}

export function DefenseConfig({ nodeId, data }: Props) {
  const dispatch = useDispatch();
  const subtype = data.defenseSubtype || 'input_reconstruction';
  const isDWE = data.cardId === 'dwe';
  const atkValue = (data.defenseParams?.atk as number) || 1;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Defense type */}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          防御类型
        </Typography>
        <Chip
          icon={<DefenseIcon sx={{ fontSize: 14 }} />}
          label={data.label}
          size="small"
          variant="outlined"
          color="secondary"
          sx={{ fontSize: '0.7rem' }}
        />
      </Box>

      {/* Description */}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          策略说明
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ lineHeight: 1.5, display: 'block' }}>
          {subtypeLabels[subtype] || ''}
        </Typography>
      </Box>

      {/* DWE slider config */}
      {isDWE && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            ATK 参数 (集成强度)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Slider
              value={atkValue}
              onChange={(_e, value) =>
                dispatch(
                  updateNodeData({
                    nodeId,
                    data: { defenseParams: { atk: value as number } },
                  })
                )
              }
              min={1}
              max={5}
              step={1}
              size="small"
              marks
              sx={{ flex: 1 }}
            />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'secondary.main', minWidth: 20 }}>
              {atkValue}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.disabled">
            控制集成模型的多样性权重强度。1 = 默认, 5 = 最大多样性
          </Typography>
        </Box>
      )}
    </Box>
  );
}
