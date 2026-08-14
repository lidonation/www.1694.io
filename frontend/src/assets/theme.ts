'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0033AD',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50,
          textTransform: 'none',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'black',
          color: 'white',
          padding: '8px',
        },
        arrow: {
          color: 'black',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          border: 'none',
          '&:hover:not($disabled):before': {
            borderBottom: 'none',
          },
          '&:after': {
            borderBottom: 'none',
          },
        },
        root: {
          border: 'none',
          // Remove the borderRadius from here
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          border: 'none',
          '&:not(.MuiInputBase-multiline)': {
            borderRadius: '50px',
          },
        },
      },
    },
  },
  typography: {
    fontFamily: 'var(--font-poppins)',
    fontWeightLight: 400,
    fontWeightRegular: 400,
    fontWeightMedium: 400,
    fontWeightBold: 400,
  },
});

export type Theme = typeof theme;
export default theme;
