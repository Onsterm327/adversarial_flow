import { memo, ReactNode } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { NodeData } from '@/types';
import { categoryColors, categoryEmojis, getDisplayCategory } from '@/theme';

interface BaseNodeExtra {
  children: ReactNode;
  hasTarget?: boolean;
  hasSource?: boolean;
  color?: string;
  maxWidth?: number;
}

type BaseNodeProps = NodeProps & BaseNodeExtra;

export const BaseNode = memo(function BaseNode({
  data: rawData,
  selected,
  children,
  hasTarget = true,
  hasSource = true,
  color,
  maxWidth,
}: BaseNodeProps) {
  const data = rawData as unknown as NodeData;
  const theme = useTheme();
  const displayCat = getDisplayCategory(data);
  const accentColor = color || categoryColors[displayCat] || '#64748b';
  const emoji = categoryEmojis[displayCat] || '';

  return (
    <Paper
      elevation={selected ? 8 : 2}
      sx={{
        minWidth: 180,
        maxWidth: maxWidth ?? 240,
        borderRadius: 2,
        overflow: 'visible',
        border: selected ? `2px solid ${accentColor}` : `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': {
          borderColor: selected ? accentColor : `${accentColor}88`,
        },
      }}
    >
      {/* Card header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 0.75,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: `${accentColor}14`,
        }}
      >
        <Typography sx={{ fontSize: '0.85rem' }}>{emoji}</Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            flex: 1,
            color: accentColor,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.label}
        </Typography>
      </Box>

      {/* Card body */}
      <Box sx={{ px: 1.5, py: 1 }}>
        {children}
        {data.description && (
          <Typography
            variant="caption"
            sx={{
              display: '-webkit-box',
              mt: children ? 0.75 : 0,
              color: 'text.disabled',
              fontSize: '0.6rem',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: '2',
              WebkitBoxOrient: 'vertical',
            }}
          >
            {data.description}
          </Typography>
        )}
      </Box>

      {/* Handles */}
      {hasTarget && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            background: accentColor,
            border: `2px solid ${theme.palette.background.paper}`,
            width: 10,
            height: 10,
            left: -5,
          }}
        />
      )}
      {hasSource && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            background: accentColor,
            border: `2px solid ${theme.palette.background.paper}`,
            width: 10,
            height: 10,
            right: -5,
          }}
        />
      )}
    </Paper>
  );
});
