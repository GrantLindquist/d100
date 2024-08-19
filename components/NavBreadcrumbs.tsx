'use client';
import { Breadcrumbs, Typography } from '@mui/material';
import { useCampaign } from '@/hooks/useCampaign';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import db from '@/utils/firebase';
import { doc, getDoc } from '@firebase/firestore';

const NavBreadcrumbs = () => {
  const { currentUnit } = useCampaign();
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
                <Link key={index} href={breadcrumb.url}>
                  {crumbTitles[index] ?? breadcrumb.url}
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
