import { ReactNode, useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  useTheme,
} from '@mui/material';
import { ExpandMore as ExpandIcon } from '@mui/icons-material';

interface Props {
  category: string;
  emoji: string;
  label: string;
  count: number;
  children: ReactNode;
}

export function CategoryGroup({ emoji, label, count, children }: Props) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      disableGutters
      sx={{
        mb: 0.5,
        '& .MuiAccordionDetails-root': { px: 0, py: 0 },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
        sx={{
          px: 1,
          borderRadius: 1,
          '&:hover': { backgroundColor: theme.palette.action.hover },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Typography sx={{ fontSize: '0.85rem' }}>{emoji}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
            {label}
          </Typography>
          <Chip
            label={count}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.65rem',
              minWidth: 24,
              backgroundColor: theme.palette.action.hover,
              '& .MuiChip-label': { px: 0.5 },
            }}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.25,
          pb: 0.5,
        }}
      >
        {children}
      </AccordionDetails>
    </Accordion>
  );
}
