import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  Box,
  useTheme,
} from '@mui/material';
import {
  Save as SaveIcon,
  FolderOpen as OpenIcon,
  Download as ExportIcon,
  DeleteOutline as ClearIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  LightMode as LightIcon,
  DarkMode as DarkIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { clearCanvas } from '@/store/slices/flowSlice';
import { startExecution, resetExecution } from '@/store/slices/executionSlice';
import { setThemeMode } from '@/store/slices/uiSlice';
import { toggleHistory, addHistory } from '@/store/slices/historySlice';
import { executePipeline, mockExecute } from '@/api/execute';
import { ExecutionSummary } from '@/types';

interface TopBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function TopBar({ canUndo, canRedo, onUndo, onRedo }: TopBarProps) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { nodes, edges } = useSelector((state: RootState) => state.flow);
  const { isRunning } = useSelector((state: RootState) => state.execution);
  const themeMode = useSelector((state: RootState) => state.ui.themeMode);

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

  const handleExecute = () => {
    if (isRunning) {
      dispatch(resetExecution());
      return;
    }

    // Find result node
    const resultNode = nodes.find(n => {
      const d = n.data as unknown as { category?: string };
      return d.category === 'result';
    });
    if (!resultNode) {
      alert('请在工作流中添加一个结果节点');
      return;
    }

    // ── Build chain matching backend lookup tables ─────────
    // Backend expects exact display names:
    //   DATASET_NAME_MAP: "CIFAR-10", "CIFAR-100", "ImageNet", "STL"
    //   MODEL_NAME_MAP:   "ResNet-18", "WideResNet-28-10"
    //   ATTACK_NAME_MAP:  "Clean", "PGD", "FGSM", "AutoAttack"
    //   DEFENSE_NAMES_CN: "DiffPure", "EBM", "IEDN", "PGD-AT", "TRADES", "AHD", "DWE"

    // Kahn topological sort: start from roots (no incoming edges)
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }
    for (const edge of edges) {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      adjacency.get(edge.source)?.push(edge.target);
    }

    const queue: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }

    const chain: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = nodes.find(n => n.id === current);
      if (!node || node.data.category === 'result') continue;

      if (node.data.category === 'attack') {
        // Attack nodes: expand selectedAttacks (e.g. ["Clean","PGD","FGSM"])
        const selected = node.data.selectedAttacks || [];
        chain.push(...selected);
      } else {
        // Dataset / Model / Defense: use node label (display name)
        chain.push(node.data.label);
      }

      for (const neighbor of adjacency.get(current) || []) {
        const newDeg = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) queue.push(neighbor);
      }
    }

    if (chain.length === 0) {
      alert('工作流中没有可执行的节点');
      return;
    }

    // ── Collect defense params (keyed by node label) ─────
    const defenseParams: Record<string, unknown> = {};
    for (const node of nodes) {
      const d = node.data;
      if (d.category === 'defense' && d.defenseParams && Object.keys(d.defenseParams).length > 0) {
        defenseParams[d.label] = d.defenseParams;
      }
    }

    // ── Callbacks bridge to Redux ───────────────────────
    const callbacks = {
      onStep: (msg: string, pct: number) => {
        dispatch({ type: 'execution/updateStep', payload: { message: msg, progress: pct } });
      },
      onMetric: (metric: { name: string; accuracy: number; samples: number }, totalSamples: number) => {
        dispatch({ type: 'execution/updateMetric', payload: metric });
        if (totalSamples > 0) {
          dispatch({ type: 'execution/setTotalSamples', payload: totalSamples });
        }
      },
      onResult: (summary: unknown) => {
        dispatch({ type: 'execution/finishExecution', payload: summary });
        dispatch(addHistory({ chain: [...chain], summary: summary as ExecutionSummary }));
      },
      onError: (err: string) => {
        dispatch({ type: 'execution/executionError', payload: err });
      },
    };

    dispatch(startExecution());

    // ── Try real backend first, fall back to mock ───────
    executePipeline(chain, defenseParams, callbacks)
      .then(() => {
        // Success — no action needed, onResult already fired
      })
      .catch((err: Error) => {
        // If backend is unreachable, fall back to mock
        console.warn('后端不可用，切换到模拟模式:', err.message);
        dispatch(resetExecution());
        dispatch(startExecution());
        mockExecute(chain, callbacks);
      });
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
            🛡️ Adversarial Defense
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

        {/* Execute button */}
        <Box sx={{ ml: 2 }}>
          <Tooltip title={isRunning ? '停止' : '执行工作流'}>
            <IconButton
              onClick={handleExecute}
              disabled={!isRunning && nodes.length === 0}
              sx={{
                background: isRunning ? theme.palette.error.main : theme.palette.primary.main,
                color: '#fff',
                '&:hover': {
                  background: isRunning ? theme.palette.error.dark : theme.palette.primary.dark,
                },
                '&.Mui-disabled': {
                  background: theme.palette.action.disabledBackground,
                  color: theme.palette.text.disabled,
                },
              }}
            >
              {isRunning ? <StopIcon /> : <PlayIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
