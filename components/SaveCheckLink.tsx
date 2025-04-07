import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { MouseEvent, ReactNode } from 'react';
import Link, { LinkProps } from 'next/link';

const SaveCheckLink = ({ children, href, ...props }: {
  children: ReactNode;
  href: string;
} & LinkProps) => {
  const { isUnsavedChanges } = useUnsavedChanges();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (isUnsavedChanges) {
      if (
        !confirm(
          'You have unsaved changes on this page. Are you sure you want to exit?',
        )
      ) {
        e.preventDefault();
        return;
      }
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      {...props}
      style={{
        color: 'inherit',
        textDecoration: 'none',
      }}
    >
      {children}
    </Link>
  );
};

export default SaveCheckLink;