'use client';

import { useState } from 'react';
import { Backdrop, Box, IconButton, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DeleteIcon from '@mui/icons-material/Delete';
import Masonry from '@mui/lab/Masonry';
import { BOLD_FONT_WEIGHT, SUBTITLE_VARIANT } from '@/utils/globals';
import { ImageUrl } from '@/types/Unit';
import ImageFrame from '@/components/content/ImageFrame';
import Image from 'next/image';

const ImageList = (props: {
  imageUrls: ImageUrl[];
  handleDeleteImage: Function;
}) => {
  const [backdropIndex, setBackdropIndex] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

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
    <>
      <Typography
        id={'Reference Images'}
        fontWeight={BOLD_FONT_WEIGHT}
        variant={SUBTITLE_VARIANT}
        pb={1}
      >
        Reference Images
      </Typography>
      <Masonry spacing={1}>
        {props.imageUrls.map((image, index) => {
          return (
            <Box
              key={index}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setOpen(true);
                setBackdropIndex(index);
              }}
            >
              <ImageFrame image={image} alt={`Enlarged image #${index}`} />
            </Box>
          );
        })}
      </Masonry>
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
    </>
  );
};
export default ImageList;
