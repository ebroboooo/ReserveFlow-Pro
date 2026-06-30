import React, { useEffect } from 'react';

const DEFAULT_TITLE = 'SmileCare Pro — Dental Clinic Management';

export const RouteTitle: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  useEffect(() => {
    document.title = `${title} — SmileCare Pro`;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
  return <>{children}</>;
};
