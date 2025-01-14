import { ReactNode } from 'react';
import { Button, Typography, useTheme } from '@mui/material';

const RoundButton = (props: {
  children: ReactNode;
  icon?: ReactNode;
  onClick: Function;
}) => {
  const theme = useTheme();
  return (
    <Button
      variant={'contained'}
      onClick={() => props.onClick()}
      startIcon={props.icon}
      sx={{
        backgroundColor: '#222222',
        borderRadius: 50,
        textTransform: 'none',
        color: '#DDDDDD',
        ':hover': {
          backgroundColor: theme.palette.primary.main,
          color: '#0a0a0a',
        },
      }}
    >
      <Typography p={0.5}>{props.children}</Typography>
    </Button>
  );
};
export default RoundButton;
