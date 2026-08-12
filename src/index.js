import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Dashboard from './comp/dashboard';
import UserGuide from './comp/UserGuide';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppConfigProvider, useAppConfig, isDarkMode } from "./core/config";

function ThemedRoot() {
  const { config } = useAppConfig();
  const darkMode = isDarkMode(config);
  const isUserGuide = typeof window !== "undefined" && window.location.search.includes("userguide");

  const theme = React.useMemo(() => createTheme({
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          "*::-webkit-scrollbar": {
            width: "10px",
            height: "20px",
          },
          "*::-webkit-scrollbar-track": {
            background: darkMode ? "#1e1e1e" : "#f3f4f6",
          },
          "*::-webkit-scrollbar-thumb": {
            backgroundColor: darkMode ? "#555" : "#9ca3af",
            borderRadius: "6px",
            border: `2px solid ${darkMode ? "#1e1e1e" : "#e5e7eb"}`,
          },
          "*::-webkit-scrollbar-thumb:hover": {
            backgroundColor: darkMode ? "#777" : "#6b7280",
          },
          "*": {
            scrollbarWidth: "thin",
            scrollbarColor: darkMode ? "#555 #1e1e1e" : "#9ca3af #e5e7eb",
          },
        },
      },
    },
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#ff7171',
      },
      background: {
        default: darkMode ? "#111827" : "#f9fafb",
        paper: darkMode ? "#1f2933" : "#ffffff",
      },
      text : {
        primary: darkMode ? '#e5e7eb' : '#111827',
        secondary: darkMode ? '#9ca3af' : '#4b5563',
      }
    },
    typography: {
      h1: {
        fontSize: '3rem',
        fontWeight: 600,
      },
      h2: {
        fontSize: '1.75rem',
        fontWeight: 500,
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
    },
  }), [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isUserGuide ? <UserGuide /> : <Dashboard />}
    </ThemeProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppConfigProvider>
      <ThemedRoot />
    </AppConfigProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
