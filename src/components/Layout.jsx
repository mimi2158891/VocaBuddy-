import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import { MdMenu } from 'react-icons/md';
import './Layout.css';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const isHomePage = location.pathname === '/' || location.pathname === '/VocaBuddy-/';

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="layout-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <main className="main-content">
        <header className="mobile-header">
          <button className="menu-btn" onClick={toggleSidebar} aria-label="Open menu">
            <MdMenu size={28} />
          </button>
          <h1 className="mobile-title">VocaBuddy</h1>
          {isHomePage && <ThemeToggle />}
        </header>

        <div className="desktop-header">
          <div className="spacer"></div>
          {isHomePage && <ThemeToggle />}
        </div>

        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
