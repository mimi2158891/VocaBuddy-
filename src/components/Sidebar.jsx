import React from 'react';
import { NavLink } from 'react-router-dom';
import { MdHome, MdAddCircle, MdUploadFile, MdList, MdStyle, MdHeadphones, MdSettings } from 'react-icons/md';
import logoImg from '../../public/logo.png';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const menuItems = [
    { name: '首頁', path: '/', icon: <MdHome /> },
    { name: '新增單字', path: '/add', icon: <MdAddCircle /> },
    { name: '匯入 CSV', path: '/import', icon: <MdUploadFile /> },
    { name: '我的單字庫', path: '/list', icon: <MdList /> },
    { name: '卡片學習模式', path: '/study', icon: <MdStyle /> },
    { name: '設定', path: '/settings', icon: <MdSettings /> },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src={logoImg} alt="VocaBuddy Logo" className="logo-icon" />
          <h2>VocaBuddy</h2>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.name}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                  onClick={() => window.innerWidth <= 768 && toggleSidebar()}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
