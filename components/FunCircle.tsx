import { Box } from '@mui/material';

const FunCircle = () => {
  return (
    <Box
      sx={{
        backgroundColor: '#101010',
        width: '75vh',
        height: '75vh',
        borderRadius: '50%',
        position: 'relative',
        zIndex: -10,
        filter: 'blur(30px)',
      }}
    ></Box>
  );
};
export default FunCircle;
