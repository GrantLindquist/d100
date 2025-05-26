import { useEffect, useRef, useState } from 'react';
import { Box, Skeleton } from '@mui/material';
import { generateUUID } from '@/utils/uuid';
import { ImageUrl } from '@/types/Unit';

const maxImageHeight = 350;

const ImageFrame = (props: { image: ImageUrl | null; alt?: string }) => {
  const frameId = useRef(generateUUID());
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameWidth, setFrameWidth] = useState(0);
  const [loading, setLoading] = useState(true);

  // Resize observer to keep frameWidth updated
  useEffect(() => {
    if (!frameRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setFrameWidth(entry.contentRect.width);
    });

    observer.observe(frameRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (props.image?.src) {
      const img = new Image();
      img.src = props.image.src;
      img.onload = () => {
        setLoading(false);
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${props.image?.src}`);
        setLoading(false);
      };

      return () => {
        img.onload = null;
        img.onerror = null;
      };
    }
  }, [props.image?.src]);

  const calculatedHeight = Math.min(frameWidth / (props.image?.ratio || 1), maxImageHeight);

  return (
    <Box
      id={frameId.current}
      ref={frameRef}
      sx={{
        width: '100%',
        height: calculatedHeight,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {loading ? (
        <Skeleton
          variant="rounded"
          sx={{
            width: '100%',
            height: '100%',
          }}
        />
      ) : (
        <img
          style={{
            width: '100%',
            maxHeight: maxImageHeight,
            objectFit: 'contain',
          }}
          src={props.image?.src || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAYAAjCB0C8AAAAASUVORK5CYII='}
          alt={props.alt ?? ''}
        />
      )}
    </Box>
  );
};

export default ImageFrame;
