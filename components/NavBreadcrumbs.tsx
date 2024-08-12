'use client';
import { Breadcrumbs, Typography } from '@mui/material';
import { useCampaign } from '@/hooks/useCampaign';
import Link from 'next/link';

const NavBreadcrumbs = () => {
  const { currentUnit } = useCampaign();

  return (
    <>
      {currentUnit && (
        <Breadcrumbs>
          {currentUnit.breadcrumbs.map((breadcrumb, index) => {
            if (index < currentUnit.breadcrumbs.length - 1) {
              return (
                <Link key={index} href={breadcrumb.url}>
                  {breadcrumb.title}
                </Link>
              );
            } else {
              return <Typography key={index}>{currentUnit.title}</Typography>;
            }
          })}
        </Breadcrumbs>
      )}
    </>
  );
};
export default NavBreadcrumbs;
