import { Box, Typography } from '@mui/material';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <Box p={10}>
      <>
        <Typography>
          You do not have permission to view this campaign.
        </Typography>
        <Link href={'/campaigns'}>Go to your Campaigns</Link>
      </>
    </Box>
  );
}
