'use client'

import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { ReactNode } from 'react';

const AppWrapper = ({ children }: { children: ReactNode }) => {

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
export default AppWrapper;