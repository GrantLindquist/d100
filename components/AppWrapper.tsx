'use client';

import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { ReactNode } from 'react';
import { UserProvider } from '@/hooks/useUser';

const AppWrapper = ({ children }: { children: ReactNode }) => {
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <UserProvider>{children}</UserProvider>
    </ThemeProvider>
  );
};
export default AppWrapper;
