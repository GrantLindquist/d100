import React from 'react';
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';

const ThemeTooltip = ({ children, ...props }: TooltipProps) => {
  const theme = useTheme();

  return (
    <Tooltip
      {...props}
      sx={{
        backgroundColor: theme.palette.primary.main,
        color: 'black',
      }}
    >
      {children}
    </Tooltip>
  );
};

export default ThemeTooltip;
