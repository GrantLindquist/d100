'use client';
import { Breadcrumbs, Typography, useTheme } from '@mui/material';
import { useCampaign } from '@/hooks/useCampaign';
import { useEffect, useState } from 'react';
import db from '@/utils/firebase';
import { doc, getDoc } from '@firebase/firestore';
import { LINK_STYLE } from '@/utils/globals';
import { useRouter } from 'next/navigation';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import SaveCheckLink from './SaveCheckLink';

const NavBreadcrumbs = () => {
  const { breadcrumbs } = useCampaign();
  const router = useRouter();
  const theme = useTheme();
  const [crumbTitles, setCrumbTitles] = useState<string[]>([]);

  useEffect(() => {
    const fetchCrumbTitles = async () => {
      let titles = [];
      for (let crumb of breadcrumbs) {
        const unitDocSnap = await getDoc(doc(db, 'units', crumb.unitId));
        if (unitDocSnap.exists()) {
          titles.push(unitDocSnap.data().title);
        }
      }
      setCrumbTitles(titles);
    };
    fetchCrumbTitles();
  }, [breadcrumbs]);

  return (
    <Breadcrumbs
      separator={
        <KeyboardArrowRightIcon style={{ color: 'grey', width: 20 }} />
      }
    >
      {breadcrumbs.map((crumb, index) => {
        if (index < breadcrumbs.length - 1) {
          return (
            <SaveCheckLink key={index} href={crumb.url}>
              <Typography sx={LINK_STYLE} color={theme.palette.primary.main}>
                {crumbTitles[index] ?? '-'}
              </Typography>
            </SaveCheckLink>
          );
        } else {
          return (
            <Typography key={index}>{crumbTitles[index] ?? '-'}</Typography>
          );
        }
      })}
    </Breadcrumbs>
  );
};
export default NavBreadcrumbs;
