import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Dashboard from './comp/dashboard';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppConfigProvider } from "./core/config";

const theme = createTheme({

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        /* Works in Chrome, Edge, Safari */
        "*::-webkit-scrollbar": {
          width: "10px",
          height: "20px",
        },
        "*::-webkit-scrollbar-track": {
          background: "#1e1e1e",
        },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: "#555",
          borderRadius: "6px",
          border: "2px solid #1e1e1e",
        },
        "*::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "#777",
        },

        /* Firefox */
        "*": {
          scrollbarWidth: "thin",
          scrollbarColor: "#555 #1e1e1e",
        },
      },
    },
  },

  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#ff7171',
    },

    text : {
      primary: '#474747',
      secondary: '#cccccc',
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
  
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppConfigProvider>
        <Dashboard />
      </AppConfigProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
