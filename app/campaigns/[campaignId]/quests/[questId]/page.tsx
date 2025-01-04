import { PageContent } from '@/components/content/PageContent';
import { Metadata } from 'next';
import { getDoc } from '@firebase/firestore';
import { doc } from 'firebase/firestore';
import db from '@/utils/firebase';

// TODO: reduce minHeight of text editor because it makes loot table look funny.
export async function generateMetadata({
  params,
}: {
  params: { questId: string };
}): Promise<Metadata> {
  const { questId } = await params;
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
