import { Box } from '@mui/material';

const FunCircle = () => {
  return (
    <Box
      sx={{
        backgroundColor: '#121212',
        width: '75vh',
        height: '75vh',
        borderRadius: '50%',
        position: 'relative',
        zIndex: -10,
      }}
    ></Box>
  );
};
export default FunCircle;
