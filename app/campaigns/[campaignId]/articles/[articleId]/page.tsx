import { PageContent } from '@/components/content/PageContent';
import { Metadata } from 'next';
import { getDoc } from '@firebase/firestore';
import { doc } from 'firebase/firestore';
import db from '@/utils/firebase';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ articleId: string }>;
}): Promise<Metadata> {
  const articleId = (await params).articleId;
  if (articleId) {
    const unitDocSnap = await getDoc(doc(db, 'units', articleId));
    return {
      title: unitDocSnap.exists() ? unitDocSnap.data().title : 'd100',
    };
  } else {
    return {
      title: 'd100',
    };
  }
}

export default function ArticlePage() {
  return <PageContent />;
}
