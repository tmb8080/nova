import React from 'react';
import MobileBottomNav from '../MobileBottomNav';
import HelpButton from '../ui/HelpButton';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="pb-20 md:pb-0">
        {children}
      </div>
      <MobileBottomNav />
      <HelpButton />
    </div>
  );
};

export default Layout;
