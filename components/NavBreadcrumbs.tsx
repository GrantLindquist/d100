'use client';
import { Breadcrumbs, Typography, useTheme } from '@mui/material';
import { useCampaign } from '@/hooks/useCampaign';
import { useEffect, useState } from 'react';
import db from '@/utils/firebase';
import { doc, getDoc } from '@firebase/firestore';
import { LINK_STYLE } from '@/utils/globals';
import { useRouter } from 'next/navigation';

const NavBreadcrumbs = () => {
  const { currentUnit } = useCampaign();
  const router = useRouter();
  const theme = useTheme();
  const [crumbTitles, setCrumbTitles] = useState<string[]>([]);

  useEffect(() => {
    const fetchCrumbTitles = async () => {
      if (currentUnit) {
        let titles = [];
        for (let crumb of currentUnit.breadcrumbs) {
          const unitDocSnap = await getDoc(doc(db, 'units', crumb.unitId));
          if (unitDocSnap.exists()) {
            titles.push(unitDocSnap.data().title);
          }
        }
        setCrumbTitles(titles);
      }
    };
    fetchCrumbTitles();
  }, [currentUnit?.id]);

  return (
    <>
      {currentUnit && (
        <Breadcrumbs>
          {currentUnit.breadcrumbs.map((breadcrumb, index) => {
            if (index < currentUnit.breadcrumbs.length - 1) {
              return (
                <Typography
                  key={index}
                  sx={LINK_STYLE}
                  color={theme.palette.primary.main}
                  onClick={() => router.push(breadcrumb.url)}
                >
                  {crumbTitles[index] ?? '-'}
                </Typography>
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
