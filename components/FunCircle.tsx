import { Box } from '@mui/material';

const FunCircle = () => {
  return (
    <Box
      sx={{
        backgroundColor: '#101010',
        width: '85vh',
        height: '85vh',
        borderRadius: '50%',
        position: 'relative',
        zIndex: -10,
        filter: 'blur(20px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          backgroundColor: 'black',
          width: '40vh',
          height: '40vh',
          borderRadius: '50%',
        }}
      />
    </Box>
  );
};

export default FunCircle;
