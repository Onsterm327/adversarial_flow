import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  paletteOpen: boolean;
  propertiesOpen: boolean;
  bottomBarOpen: boolean;
  themeMode: 'dark' | 'light';
}

const initialState: UiState = {
  paletteOpen: true,
  propertiesOpen: true,
  bottomBarOpen: true,
  themeMode: 'dark',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    togglePalette(state) {
      state.paletteOpen = !state.paletteOpen;
    },
    toggleProperties(state) {
      state.propertiesOpen = !state.propertiesOpen;
    },
    toggleBottomBar(state) {
      state.bottomBarOpen = !state.bottomBarOpen;
    },
    setThemeMode(state, action: PayloadAction<'dark' | 'light'>) {
      state.themeMode = action.payload;
    },
  },
});

export const { togglePalette, toggleProperties, toggleBottomBar, setThemeMode } = uiSlice.actions;
export default uiSlice.reducer;
