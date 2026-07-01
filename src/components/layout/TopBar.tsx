import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  Box,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  FolderOpen as OpenIcon,
  Download as ExportIcon,
  DeleteOutline as ClearIcon,
  LightMode as LightIcon,
  DarkMode as DarkIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  History as HistoryIcon,
  Dashboard as TemplateIcon,
  AutoFixHigh as LayoutIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { clearCanvas, loadWorkflow, addNode, addEdge } from '@/store/slices/flowSlice';
import { getEdgeStyle } from '@/utils/validation';
import { setThemeMode } from '@/store/slices/uiSlice';
import { toggleHistory } from '@/store/slices/historySlice';
import { TEMPLATES } from '@/data/templates';
import { autoLayout } from '@/utils/layout';
import { encodeWorkflow, copyToClipboard } from '@/utils/share';

interface TopBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function TopBar({ canUndo, canRedo, onUndo, onRedo }: TopBarProps) {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { nodes, edges } = useSelector((state: RootState) => state.flow);
  const themeMode = useSelector((state: RootState) => state.ui.themeMode);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const handleAutoLayout = () => {
    if (nodes.length === 0) return;
    const layouted = autoLayout(nodes, edges);
    dispatch(loadWorkflow({ nodes: layouted, edges }));
  };

  const handleShare = async () => {
    if (nodes.length === 0) return;
    const encoded = encodeWorkflow(nodes, edges);
    const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
    const ok = await copyToClipboard(url);
    setShareMsg(ok ? '链接已复制到剪贴板' : '复制失败');
    setTimeout(() => setShareMsg(null), 2000);
  };

  const handleSave = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          if (data.nodes && data.edges) {
            dispatch(clearCanvas());
            // Load via individual dispatches to ensure proper state
            data.nodes.forEach((n: typeof nodes[0]) => {
              dispatch({ type: 'flow/addNode', payload: n });
            });
            data.edges.forEach((e: typeof edges[0]) => {
              dispatch({ type: 'flow/addEdge', payload: e });
            });
          }
        } catch {
          alert('无效的工作流文件');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportImage = () => {
    // Use ReactFlow's built-in export if available, otherwise screenshot
    const viewport = document.querySelector('.react-flow__viewport');
    if (viewport) {
      const svg = viewport.querySelector('svg');
      if (svg) {
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svg);
        const blob = new Blob([source], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'workflow.svg';
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };


  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar variant="dense" sx={{ minHeight: 48, px: 2, gap: 0.5 }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: theme.palette.primary.main }}>
            🛡️ 对抗防御工作流系统
          </Typography>
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Node/Edge counts */}
        <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
          {nodes.length} 节点 | {edges.length} 连线
        </Typography>

        {/* Undo/Redo */}
        <Tooltip title="撤销 (Ctrl+Z)">
          <span>
            <IconButton size="small" onClick={onUndo} disabled={!canUndo}>
              <UndoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="重做 (Ctrl+Shift+Z)">
          <span>
            <IconButton size="small" onClick={onRedo} disabled={!canRedo}>
              <RedoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        {/* Actions */}
        <Tooltip title="保存工作流 (JSON)">
          <IconButton size="small" onClick={handleSave} disabled={nodes.length === 0}>
            <SaveIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="加载工作流">
          <IconButton size="small" onClick={handleLoad}>
            <OpenIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="导出 SVG">
          <IconButton size="small" onClick={handleExportImage} disabled={nodes.length === 0}>
            <ExportIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="自动布局">
          <IconButton size="small" onClick={handleAutoLayout} disabled={nodes.length === 0}>
            <LayoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={shareMsg || '一键分享'}>
          <IconButton size="small" onClick={handleShare} disabled={nodes.length === 0}>
            <ShareIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="清空画布">
          <IconButton size="small" onClick={() => dispatch(clearCanvas())} disabled={nodes.length === 0}>
            <ClearIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* History */}
        <Tooltip title="执行历史">
          <IconButton size="small" onClick={() => dispatch(toggleHistory())}>
            <HistoryIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip title={themeMode === 'dark' ? '切换白天模式' : '切换夜间模式'}>
          <IconButton
            size="small"
            onClick={() => dispatch(setThemeMode(themeMode === 'dark' ? 'light' : 'dark'))}
          >
            {themeMode === 'dark' ? <LightIcon fontSize="small" /> : <DarkIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* Templates */}
        <Tooltip title="工作流模板">
          <IconButton size="small" onClick={() => setTemplateOpen(true)}>
            <TemplateIcon fontSize="small" />
          </IconButton>
        </Tooltip>

      </Toolbar>

      {/* Template dialog */}
      <Dialog open={templateOpen} onClose={() => setTemplateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '0.95rem' }}>工作流模板</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 0.5 }}>
          {TEMPLATES.map(tpl => (
            <Box
              key={tpl.key}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: theme.palette.action.hover,
                },
              }}
              onClick={() => {
                // Auto-layout the template nodes before dispatching
                const layouted = autoLayout(tpl.nodes, tpl.edges);
                dispatch(clearCanvas());
                layouted.forEach(n => dispatch(addNode(n)));
                tpl.edges.forEach(e => {
                  const sourceNode = layouted.find(n => n.id === e.source);
                  const edgeStyle = sourceNode ? getEdgeStyle(sourceNode.data) : { text: '', color: '#64748b' };
                  dispatch(addEdge({
                    ...e,
                    label: edgeStyle.text || undefined,
                    style: { stroke: edgeStyle.color, strokeWidth: 2 },
                    labelStyle: { fill: edgeStyle.color, fontWeight: 500, fontSize: 11 },
                    labelBgStyle: { fill: '#1e293b', fillOpacity: 0.9 },
                    labelBgPadding: [8, 4] as [number, number],
                    labelBgBorderRadius: 4,
                    markerEnd: { type: 'arrowclosed' as const, color: edgeStyle.color, width: 16, height: 16 },
                  }));
                });
                setTemplateOpen(false);
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{tpl.name}</Typography>
                <Chip label={`${tpl.nodes.length} 节点`} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
              </Box>
              <Typography variant="caption" color="text.secondary">{tpl.description}</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateOpen(false)} size="small">关闭</Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}
