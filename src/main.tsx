import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useSelector } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store, RootState } from '@/store';
import { darkTheme, lightTheme } from '@/theme';
import { App } from './App';
import './styles/global.css';

function ThemedApp() {
  const themeMode = useSelector((state: RootState) => state.ui.themeMode);
  const theme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemedApp />
    </Provider>
  </React.StrictMode>
);
