'use client';
import { Poppins, Roboto } from 'next/font/google';
import { createTheme } from '@mui/material/styles';

const poppins = Poppins({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  subsets: ['devanagari'],
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#0033AD',
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50,
          textTransform: 'none',
          backgroundColor: '#0033AD',
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
    fontFamily: poppins.style.fontFamily,
  },
});

export type Theme = typeof theme;
export default theme;