import { useCallback } from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import { CardDef } from '@/types';
import { categoryColors, getDisplayCategory } from '@/theme';

interface Props {
  card: CardDef;
}

export function PaletteItem({ card }: Props) {
  const theme = useTheme();
  const displayCat = getDisplayCategory(card);
  const color = categoryColors[displayCat] || categoryColors[card.category];

  const onDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.dataTransfer.setData('application/reactflow-card', JSON.stringify(card));
      event.dataTransfer.effectAllowed = 'move';
    },
    [card]
  );

  return (
    <Tooltip
      title={card.description}
      placement="right"
      arrow
      enterDelay={500}
    >
      <Box
        draggable
        onDragStart={onDragStart}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.75,
          mx: 0.5,
          borderRadius: 1,
          cursor: 'grab',
          border: `1px solid transparent`,
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            borderColor: `${color}44`,
          },
          '&:active': {
            cursor: 'grabbing',
            opacity: 0.7,
          },
        }}
      >
        {/* Color indicator dot */}
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: color,
            flexShrink: 0,
          }}
        />

        {/* Name */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {card.name}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
}
