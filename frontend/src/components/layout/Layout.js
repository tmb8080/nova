import React from 'react';
import MobileBottomNav from '../MobileBottomNav';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';
import HelpButton from '../ui/HelpButton';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-binance-dark transition-colors duration-200">
      <DesktopNav />
      <MobileNav />
      <div className="pb-20 md:pb-0 md:pt-16">
        <div className="min-h-screen bg-white dark:bg-binance-dark">
          {children}
        </div>
      </div>
      <MobileBottomNav />
      <HelpButton />
    </div>
  );
};

export default Layout;
