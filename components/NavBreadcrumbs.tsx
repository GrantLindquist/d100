'use client';
import { Breadcrumbs, Skeleton, Typography, useTheme } from '@mui/material';
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
        const isLast = index === breadcrumbs.length - 1;
        const title = crumbTitles[index];

        const content = title ? (
          <Typography sx={!isLast ? LINK_STYLE : undefined} color={!isLast ? theme.palette.primary.main : undefined}>
            {title}
          </Typography>
        ) : (
          <Skeleton width={100} />
        );

        return (
          <div key={index}>
            {!isLast && title ? (
              <SaveCheckLink href={crumb.url}>{content}</SaveCheckLink>
            ) : (
              content
            )}
          </div>
        );
      })}
    </Breadcrumbs>
  );
};
export default NavBreadcrumbs;
