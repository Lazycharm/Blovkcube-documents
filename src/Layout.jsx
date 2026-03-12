import React from "react";

export default function Layout({ children, currentPageName }) {
  const isFullPage = ["CreateDocument", "DocumentPreview"].includes(currentPageName);

  if (isFullPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @media print {
          nav, .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          body { background: white !important; }
        }
      `}</style>
      {children}
    </div>
  );
}