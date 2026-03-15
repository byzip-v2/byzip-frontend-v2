'use client';

import React from 'react';
import Header from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="mt-[60px] flex-1 flex flex-col md:flex-row">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
