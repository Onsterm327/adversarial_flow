import {
  Box,
  Typography,
  IconButton,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { selectNode, removeNode } from '@/store/slices/flowSlice';
import { NodeConfig } from './NodeConfig';

export function PropertiesPanel() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { nodes, selectedNodeId } = useSelector((state: RootState) => state.flow);
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          py: 0.75,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <SettingsIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
        <Typography variant="subtitle2" sx={{ flex: 1, color: 'text.secondary' }}>
          属性面板
        </Typography>
        {selectedNode && (
          <IconButton
            size="small"
            onClick={() => dispatch(selectNode(null))}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
        {selectedNode ? (
          <NodeConfig
            node={selectedNode}
            onDelete={() => dispatch(removeNode(selectedNode.id))}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 1,
              color: 'text.disabled',
            }}
          >
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              选择一个节点以查看其属性
            </Typography>
            <Typography variant="caption" sx={{ textAlign: 'center', maxWidth: 200 }}>
              点击画布上的任意节点来编辑其配置、查看参数或删除节点
            </Typography>
          </Box>
        )}
      </Box>

      {/* Quick stats */}
      <Divider />
      <Box sx={{ p: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          节点总数: {nodes.length} | 选中: {selectedNode ? selectedNode.data.label : '无'}
        </Typography>
      </Box>
    </Box>
  );
}
