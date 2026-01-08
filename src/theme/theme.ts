'use client';

import { createTheme, alpha } from '@mui/material/styles';

const teal = {
  main: '#14b8a6',
  light: '#5eead4',
  dark: '#0f766e',
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: teal.main,
      light: teal.light,
      dark: teal.dark,
    },
    secondary: {
      main: '#06b6d4', // Cyan 500
      light: '#22d3ee',
      dark: '#0891b2',
    },
    background: {
      default: '#0f172a', // Slate 900
      paper: '#1e293b', // Slate 800
    },
    success: {
      main: '#22c55e',
      light: '#4ade80',
      dark: '#16a34a',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    info: {
      main: teal.main,
      light: teal.light,
      dark: teal.dark,
    },
    divider: alpha(teal.main, 0.12),
    text: {
      primary: '#f1f5f9', // Slate 100
      secondary: '#94a3b8', // Slate 400
    },
  },
  typography: {
    fontFamily: 'var(--font-inter), "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: `${alpha(teal.main, 0.3)} ${alpha('#1e293b', 0.5)}`,
          '&::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(teal.main, 0.3),
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: alpha('#1e293b', 0.5),
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, ${teal.dark} 0%, ${teal.main} 100%)`,
          boxShadow: `0 4px 20px ${alpha(teal.main, 0.3)}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          borderRight: `1px solid ${alpha(teal.main, 0.15)}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: alpha('#1e293b', 0.7),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(teal.main, 0.1)}`,
          boxShadow: `0 8px 32px ${alpha('#000000', 0.3)}`,
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 12px 40px ${alpha('#000000', 0.4)}, 0 0 20px ${alpha(teal.main, 0.1)}`,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: `0 4px 20px ${alpha('#000000', 0.25)}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${teal.main} 0%, #06b6d4 100%)`,
          boxShadow: `0 4px 14px ${alpha(teal.main, 0.4)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${teal.dark} 0%, #0891b2 100%)`,
            boxShadow: `0 6px 20px ${alpha(teal.main, 0.5)}`,
          },
        },
        outlinedPrimary: {
          borderColor: alpha(teal.main, 0.5),
          '&:hover': {
            borderColor: teal.main,
            backgroundColor: alpha(teal.main, 0.1),
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: alpha(teal.main, 0.1),
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
        colorPrimary: {
          boxShadow: `0 0 10px ${alpha(teal.main, 0.4)}`,
        },
        colorSuccess: {
          boxShadow: `0 0 10px ${alpha('#22c55e', 0.3)}`,
        },
        colorError: {
          boxShadow: `0 0 10px ${alpha('#ef4444', 0.3)}`,
        },
        colorInfo: {
          boxShadow: `0 0 10px ${alpha('#06b6d4', 0.3)}`,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        primary: {
          background: `linear-gradient(135deg, ${teal.main} 0%, #06b6d4 100%)`,
          boxShadow: `0 0 20px ${alpha(teal.main, 0.5)}`,
          '&:hover': {
            boxShadow: `0 0 30px ${alpha(teal.main, 0.7)}`,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          background: '#1e293b',
          border: `1px solid ${alpha(teal.main, 0.15)}`,
          boxShadow: `0 25px 50px ${alpha('#000000', 0.5)}`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(teal.main, 0.5),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: teal.main,
              boxShadow: `0 0 8px ${alpha(teal.main, 0.3)}`,
            },
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: alpha(teal.dark, 0.3),
            fontWeight: 600,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: alpha(teal.main, 0.05),
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          '&.Mui-selected': {
            backgroundColor: alpha(teal.main, 0.15),
            '&:hover': {
              backgroundColor: alpha(teal.main, 0.25),
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 3,
              height: '60%',
              backgroundColor: teal.main,
              borderRadius: '0 4px 4px 0',
            },
          },
          '&:hover': {
            backgroundColor: alpha(teal.main, 0.1),
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: alpha(teal.main, 0.2),
            color: teal.light,
            '&:hover': {
              backgroundColor: alpha(teal.main, 0.3),
            },
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: alpha(teal.main, 0.2),
        },
        bar: {
          borderRadius: 4,
          background: `linear-gradient(90deg, ${teal.main} 0%, ${teal.light} 100%)`,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        standardSuccess: {
          backgroundColor: alpha('#22c55e', 0.15),
          border: `1px solid ${alpha('#22c55e', 0.3)}`,
        },
        standardError: {
          backgroundColor: alpha('#ef4444', 0.15),
          border: `1px solid ${alpha('#ef4444', 0.3)}`,
        },
        standardWarning: {
          backgroundColor: alpha('#f59e0b', 0.15),
          border: `1px solid ${alpha('#f59e0b', 0.3)}`,
        },
        standardInfo: {
          backgroundColor: alpha(teal.main, 0.15),
          border: `1px solid ${alpha(teal.main, 0.3)}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1e293b',
          border: `1px solid ${alpha(teal.main, 0.2)}`,
          boxShadow: `0 4px 20px ${alpha('#000000', 0.3)}`,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#94a3b8', 0.1),
        },
      },
    },
  },
});

export default theme;
