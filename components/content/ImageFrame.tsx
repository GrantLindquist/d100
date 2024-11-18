import React, { useEffect, useRef, useState } from 'react';
import { Box, Skeleton } from '@mui/material';
import { generateUUID } from '@/utils/uuid';
import { ImageUrl } from '@/types/Unit';

const maxImageHeight = 350;

const ImageFrame = (props: { image: ImageUrl; alt?: string }) => {
  const frameId = useRef(generateUUID());
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameWidth, setFrameWidth] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (frameRef.current) {
      setFrameWidth(frameRef.current.offsetWidth);
    }
    const img = new Image();
    img.src = props.image.src;
    img.onload = () => {
      setLoading(false);
    };
    img.onerror = () => {
      console.error(`Failed to load image: ${props.image.src}`);
      setLoading(false);
    };
  }, []);

  return (
    <Box
      id={frameId.current}
      ref={frameRef}
      sx={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {loading ? (
        <Skeleton
          variant={'rounded'}
          sx={{
            width: '100%',
            height: frameWidth / props.image.ratio,
            maxHeight: maxImageHeight,
          }}
        />
      ) : (
        <img
          style={{
            width: '100%',
            maxWidth: maxImageHeight * props.image.ratio,
            maxHeight: maxImageHeight,
          }}
          src={props.image.src}
          alt={props.alt ?? ''}
        />
      )}
    </Box>
  );
};

export default ImageFrame;
