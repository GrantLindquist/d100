'use client';

import { useState } from 'react';
import { Backdrop, Box, IconButton, Stack, Typography } from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DeleteIcon from '@mui/icons-material/Delete';
import Masonry from '@mui/lab/Masonry';

const ImageList = (props: {
  imageUrls: string[];
  handleDeleteImage: Function;
}) => {
  const [backdropIndex, setBackdropIndex] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <Typography id={'Reference Images'} variant={'h4'}>
        Reference Images
      </Typography>
      <Masonry spacing={1}>
        {props.imageUrls.map((url, index) => {
          return (
            <img
              key={index}
              alt={`Reference Image #${index}`}
              src={url}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setOpen(true);
                setBackdropIndex(index);
              }}
            />
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
          sx={{ height: '65%' }}
          onClick={(event) => event.stopPropagation()}
        >
          <img
            style={{ height: '100%' }}
            src={backdropIndex !== null ? props.imageUrls[backdropIndex] : ''}
            alt={'Resized Reference Image'}
          />
          {/* TODO: Change UI to not resize w/ image width */}
          <Stack direction={'row'}>
            <Box flexGrow={1}>
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
            </Box>
            <IconButton
              onClick={() => {
                if (backdropIndex !== null) {
                  setOpen(false);
                  setBackdropIndex(null);
                  props.handleDeleteImage(backdropIndex);
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        </Box>
      </Backdrop>
    </>
  );
};
export default ImageList;
