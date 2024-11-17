import React, { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@mui/material';
import { generateUUID } from '@/utils/uuid';
import { ImageUrl } from '@/types/Unit';

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
    <div id={frameId.current} ref={frameRef}>
      {loading ? (
        <Skeleton
          variant={'rounded'}
          width={'100%'}
          height={frameWidth / props.image.ratio}
        />
      ) : (
        <img
          style={{
            width: '100%',
            height: 'auto',
          }}
          src={props.image.src}
          alt={props.alt ?? ''}
        />
      )}
    </div>
  );
};

export default ImageFrame;
