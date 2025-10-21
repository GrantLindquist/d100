'use client';
import { createContext, ReactNode, useContext, useState } from 'react';
import { Box, Snackbar, Stack, Typography } from '@mui/material';
import Link from 'next/link';

interface Alert {
  message: string;
  link?: string;
  errorType?: string;
}

const AlertContext = createContext<{
  displayAlert: (alert: Alert) => void;
}>({
  displayAlert: () => {
  },
});

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alert, setAlert] = useState<Alert>({
    message: '',
  });
  const [open, setOpen] = useState(false);

  const displayAlert = (alert: Alert) => {
    Boolean(alert.errorType) && console.error(alert.errorType);
    console.error(alert.message)
    setAlert(alert);
    setOpen(true);
  };

  return (
    <AlertContext.Provider value={{ displayAlert }}>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={() => setOpen(false)}
      >
        <Box
          sx={{
            width: 500,
            backgroundColor: '#222222',
            borderRadius: '5px',
            borderWidth: 0,
            borderLeftWidth: 10,
            borderStyle: 'solid',
            paddingY: 0.5,
            ...(alert.errorType
              ? {
                borderColor: 'red',
              }
              : {
                borderColor: '#00FF00',
              }),
          }}
        >
          <Stack py={1} px={2} direction={'row'} alignItems={'center'}>
            <Box flexGrow={1}>
              <Typography>{alert.message}</Typography>
              {alert.errorType && (
                <Typography sx={{ color: 'grey' }}>
                  {alert.errorType}
                </Typography>
              )}
            </Box>
            {alert.link && (
              <Link
                href={alert.link ?? '#'}
                style={{
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              > Open</Link>
            )}
          </Stack>
        </Box>
      </Snackbar>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used inside AlertProvider');
  return context;
};
