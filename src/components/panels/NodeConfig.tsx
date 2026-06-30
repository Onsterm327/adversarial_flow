import {
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  TextField,
  useTheme,
} from '@mui/material';
import {
  DeleteOutline as DeleteIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { Node } from '@xyflow/react';
import { useDispatch } from 'react-redux';
import { NodeData } from '@/types';
import { updateNodeData } from '@/store/slices/flowSlice';
import { categoryColors, categoryLabels, categoryEmojis, getDisplayCategory } from '@/theme';
import { AttackConfig } from './AttackConfig';
import { DefenseConfig } from './DefenseConfig';

interface Props {
  node: Node<NodeData>;
  onDelete: () => void;
}

export function NodeConfig({ node, onDelete }: Props) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const data = node.data;
  const color = categoryColors[data.category] || '#64748b';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Node identity */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography sx={{ fontSize: '1.1rem' }}>{categoryEmojis[data.category]}</Typography>
          <Typography variant="h6" sx={{ flex: 1 }}>
            {data.label}
          </Typography>
          <Chip
            label={categoryLabels[getDisplayCategory(data)] || categoryLabels[data.category]}
            size="small"
            sx={{
              backgroundColor: `${color}22`,
              color,
              fontWeight: 500,
              fontSize: '0.65rem',
            }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          ID: {node.id}
        </Typography>
      </Box>

      <Divider />

      {/* Label edit */}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          节点名称
        </Typography>
        <TextField
          fullWidth
          size="small"
          value={data.label}
          onChange={e =>
            dispatch(updateNodeData({ nodeId: node.id, data: { label: e.target.value } }))
          }
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.8rem',
              borderRadius: 1,
            },
          }}
        />
      </Box>

      {/* Description edit */}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          描述
        </Typography>
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={2}
          maxRows={5}
          value={data.description || ''}
          onChange={e =>
            dispatch(updateNodeData({ nodeId: node.id, data: { description: e.target.value } }))
          }
          placeholder="添加节点描述..."
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.75rem',
              borderRadius: 1,
            },
          }}
        />
      </Box>

      {/* Category info */}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          类别信息
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip
            icon={<CategoryIcon sx={{ fontSize: 14 }} />}
            label={`${categoryEmojis[data.category]} ${categoryLabels[data.category]}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
          {data.defenseSubtype && (
            <Chip
              label={defenseSubtypeLabel(data.defenseSubtype)}
              size="small"
              color="secondary"
              variant="filled"
              sx={{ fontSize: '0.65rem' }}
            />
          )}
        </Box>
      </Box>

      {/* Category-specific config */}
      {data.category === 'attack' && (
        <AttackConfig nodeId={node.id} data={data} />
      )}

      {data.category === 'defense' && (
        <DefenseConfig nodeId={node.id} data={data} />
      )}

      {/* Connection rules hint */}
      <Divider />
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          连接规则
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ lineHeight: 1.5, display: 'block' }}>
          {getConnectionHint(data)}
        </Typography>
      </Box>

      {/* Delete button */}
      <Button
        fullWidth
        variant="outlined"
        color="error"
        size="small"
        onClick={onDelete}
        startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
        sx={{ mt: 1, fontSize: '0.75rem' }}
      >
        删除节点
      </Button>
    </Box>
  );
}

function defenseSubtypeLabel(subtype: string): string {
  const map: Record<string, string> = {
    input_reconstruction: '输入重构',
    adversarial_training: '对抗训练',
    active_defense: '主动防御',
    ensemble_defense: '集成防御',
  };
  return map[subtype] || subtype;
}

function getConnectionHint(data: NodeData): string {
  switch (data.category) {
    case 'dataset':
      return '可连接至: 攻击节点、输入重构防御、对抗训练防御、集成防御、模型节点';
    case 'model':
      return '可连接至: 结果节点（仅此一项）';
    case 'attack':
      return '可连接至: 输入重构防御、对抗训练防御、集成防御、模型节点';
    case 'defense':
      if (data.defenseSubtype === 'active_defense')
        return '不接受输入。只能作为起点连接至: 攻击节点';
      if (data.defenseSubtype === 'input_reconstruction')
        return '可连接至: 模型节点。可从数据集、攻击节点接收输入';
      return '可连接至: 模型节点。可从数据集、攻击节点接收输入';
    case 'result':
      return '可接收: 来自模型节点的连接（工作流终点）';
    default:
      return '';
  }
}
