'use client';

import { useEffect, useState } from 'react';
import { Backdrop, Box, IconButton, Paper, Stack, useMediaQuery, useTheme } from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DeleteIcon from '@mui/icons-material/Delete';
import { ImageUrl } from '@/types/Unit';
import Image from 'next/image';

const ExpandImage = (props: {
  imageUrls: ImageUrl[];
  openedBackdropIndex: number | null;
  setOpenedBackdropIndex: Function;
  handleDeleteImage: Function;
}) => {
  const [backdropIndex, setBackdropIndex] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setBackdropIndex(props.openedBackdropIndex);
    if (props.openedBackdropIndex !== null) {
      setOpen(true);
    }
  }, [props.openedBackdropIndex]);

  useEffect(() => {
    if (!open) {
      setBackdropIndex(null);
      props.setOpenedBackdropIndex(null);
    }
  }, [open]);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));

  const changeBackdrop = (difference: -1 | 1) => {
    if (backdropIndex !== null) {
      const imageUrlCount = props.imageUrls.length;
      if (backdropIndex <= 0 && difference === -1) {
        setBackdropIndex(imageUrlCount - 1);
      } else if (backdropIndex >= imageUrlCount - 1) {
        setBackdropIndex(0);
      } else {
        setBackdropIndex(backdropIndex + difference);
      }
    }
  };

  const handleDeleteImage = () => {
    if (backdropIndex !== null) {
      if (props.imageUrls.length <= 1) {
        setOpen(false);
        setBackdropIndex(null);
      } else if (backdropIndex === props.imageUrls.length - 1) {
        changeBackdrop(-1);
      }
      props.handleDeleteImage(backdropIndex);
    }
  };

  return (
    <Backdrop
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
      open={open}
      onClick={() => setOpen(false)}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isDesktop ? '70%' : '100%',
          height: '80%',
          position: 'relative',
        }}
      >
        {backdropIndex !== null && <>
          <Image
            fill
            src={props.imageUrls[backdropIndex].src}
            alt="Resized Reference Image"
            style={{
              objectFit: 'contain',
            }}
          />
          <Paper
            onClick={(event) => event.stopPropagation()}
            sx={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <Stack direction={'row'}>
              <IconButton
                disabled={props.imageUrls.length <= 1}
                onClick={() => changeBackdrop(-1)}
              >
                <KeyboardArrowLeftIcon />
              </IconButton>
              <IconButton
                disabled={props.imageUrls.length <= 1}
                onClick={() => changeBackdrop(1)}
              >
                <KeyboardArrowRightIcon />
              </IconButton>
              <Box sx={{ pl: 4 }}>
                <IconButton onClick={handleDeleteImage}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Stack>
          </Paper>
        </>}
      </Box>
    </Backdrop>
  );
};
export default ExpandImage;
