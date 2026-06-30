import { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  Typography,
  InputAdornment,
  useTheme,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { CARDS } from '@/data/cards';
import {
  categoryEmojis,
  categoryLabels,
  getDisplayCategory,
  DISPLAY_CATEGORY_ORDER,
} from '@/theme';
import { PaletteItem } from './PaletteItem';
import { CategoryGroup } from './CategoryGroup';

export function NodePalette() {
  const theme = useTheme();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return CARDS;
    const q = search.toLowerCase();
    return CARDS.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.defenseSubtype && categoryLabels[getDisplayCategory(c)]?.includes(q)) ||
        c.description.toLowerCase().includes(q)
    );
  }, [search]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof CARDS> = {};
    for (const cat of DISPLAY_CATEGORY_ORDER) {
      const items = filtered.filter(c => getDisplayCategory(c) === cat);
      if (items.length > 0) {
        groups[cat] = items;
      }
    }
    return groups;
  }, [filtered]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          节点面板
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="搜索节点..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.8rem',
              borderRadius: 1,
              backgroundColor: theme.palette.background.default,
            },
          }}
        />
      </Box>

      {/* Node list */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 0.5, py: 0.5 }}>
        {Object.entries(grouped).map(([category, items]) => (
          <CategoryGroup
            key={category}
            category={category}
            emoji={categoryEmojis[category] || ''}
            label={categoryLabels[category] || category}
            count={items.length}
          >
            {items.map(card => (
              <PaletteItem key={card.id} card={card} />
            ))}
          </CategoryGroup>
        ))}

        {Object.keys(grouped).length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              没有匹配 "{search}" 的节点
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
