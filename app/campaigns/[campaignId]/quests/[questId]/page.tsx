import { PageContent } from '@/components/content/PageContent';
import { Metadata } from 'next';
import { getDoc } from '@firebase/firestore';
import { doc } from 'firebase/firestore';
import db from '@/utils/firebase';

// TODO: Display 1st reference image as OpenGraph attribute if exists
export async function generateMetadata({
  params,
}: {
  params: Promise<{ questId: string }>;
}): Promise<Metadata> {
  const questId = (await params).questId;
  if (questId) {
    const unitDocSnap = await getDoc(doc(db, 'units', questId));
    return {
      title: unitDocSnap.exists() ? unitDocSnap.data().title : 'd100',
    };
  } else {
    return {
      title: 'd100',
    };
  }
}

export default function QuestPage() {
  return <PageContent />;
}
