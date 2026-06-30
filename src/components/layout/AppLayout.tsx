import { Box, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { TopBar } from './TopBar';
import { BottomBar } from './BottomBar';
import { NodePalette } from '@/components/palette/NodePalette';
import { WorkflowCanvas } from '@/components/canvas/WorkflowCanvas';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { useWorkflowPersistence } from '@/utils/persistence';

const PALETTE_WIDTH = 280;
const PROPERTIES_WIDTH = 320;

export function AppLayout() {
  const theme = useTheme();
  const { paletteOpen, propertiesOpen, bottomBarOpen } = useSelector(
    (state: RootState) => state.ui
  );

  // Auto-save/load workflow from localStorage
  useWorkflowPersistence();

  const topBarHeight = 48;
  const bottomBarHeight = bottomBarOpen ? 36 : 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: theme.palette.background.default,
      }}
    >
      {/* Top App Bar */}
      <TopBar />

      {/* Main Content Area */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          height: `calc(100vh - ${topBarHeight}px - ${bottomBarHeight}px)`,
        }}
      >
        {/* Left Palette */}
        {paletteOpen && (
          <Box
            sx={{
              width: PALETTE_WIDTH,
              minWidth: PALETTE_WIDTH,
              borderRight: `1px solid ${theme.palette.divider}`,
              background: theme.palette.background.paper,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <NodePalette />
          </Box>
        )}

        {/* Center Canvas */}
        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <WorkflowCanvas />
        </Box>

        {/* Right Properties Panel */}
        {propertiesOpen && (
          <Box
            sx={{
              width: PROPERTIES_WIDTH,
              minWidth: PROPERTIES_WIDTH,
              borderLeft: `1px solid ${theme.palette.divider}`,
              background: theme.palette.background.paper,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <PropertiesPanel />
          </Box>
        )}
      </Box>

      {/* Bottom Status Bar */}
      {bottomBarOpen && <BottomBar />}
    </Box>
  );
}
