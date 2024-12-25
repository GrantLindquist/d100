'use client';
import {
  createContext,
  ReactNode,
  SyntheticEvent,
  useContext,
  useState,
} from 'react';
import { Box, Button, Snackbar, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

interface Alert {
  message: string;
  link?: string;
  isError?: boolean;
  errorType?: string;
}

const AlertContext = createContext<{
  displayAlert: (alert: Alert) => void;
}>({
  displayAlert: () => {},
});

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [alert, setAlert] = useState<Alert>({
    message: '',
  });
  const [open, setOpen] = useState(false);

  const displayAlert = (alert: Alert) => {
    setAlert(alert);
    setOpen(true);
  };

  const handleClose = (event: SyntheticEvent | Event, reason: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const handleNavigate = (link: string) => {
    setOpen(false);
    router.push(link);
  };

  // TODO: Redesign this
  return (
    <AlertContext.Provider value={{ displayAlert }}>
      <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
        <Box
          sx={{
            width: 500,
            backgroundColor: '#111111',
            borderRadius: '5px',
            borderWidth: 1,
            borderStyle: 'solid',
            paddingY: 0.5,
            ...(alert.isError
              ? {
                  borderColor: 'red',
                }
              : {
                  borderColor: 'rgba(0, 255, 0, .4)',
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
              <Button onClick={() => handleNavigate(alert.link ?? '')}>
                Open
              </Button>
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
