import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const SaveCheckLink = ({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) => {
  const { isUnsavedChanges } = useUnsavedChanges();
  const router = useRouter();

  const handlePushUrl = (href: string) => {
    if (isUnsavedChanges) {
      if (
        !confirm(
          'You have unsaved changes on this page. Are you sure you want to exit?'
        )
      ) {
        return;
      }
    }
    router.push(href);
  };

  return (
    <div style={{ cursor: 'pointer' }} onClick={() => handlePushUrl(href)}>
      {children}
    </div>
  );
};
export default SaveCheckLink;
