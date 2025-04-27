import { MouseEvent, ReactNode } from 'react';
import { Box, Stack } from '@mui/material';

export const SmallIconButton = (props: {
  icon: ReactNode;
  onClick: (event: MouseEvent<HTMLSpanElement>) => void;
  disabled?: boolean;
}) => {
  return (
    <Box
      onClick={(e) => {
        if (!props.disabled) props.onClick(e);
      }}
      sx={(theme) => ({
        cursor: props.disabled ? 'default' : 'pointer',
        height: 24,
        width: 24,
        color: props.disabled ? '#444' : 'grey',
        ':hover': !props.disabled ? {
          color: theme.palette.primary.main,
        } : {},
      })}
    >
      {props.icon}
    </Box>
  );
};

export const SmallIconButtonGroup = (props: { children: ReactNode }) => {
  return (
    <Stack direction="row" spacing={1.5} py={.5} alignItems="center" justifyContent="right">
      {props.children}
    </Stack>
  );
};
