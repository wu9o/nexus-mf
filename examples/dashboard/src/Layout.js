import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './styles.css';

const Layout = () => {
  return (
    <div className="nexus-dashboard">
      <header className="nexus-dashboard__header">
        <div>
          <span className="nexus-dashboard__eyebrow">远程微应用 · dashboard</span>
          <h1>运营数据看板</h1>
        </div>
        <span className="nexus-dashboard__version">v1.0.0</span>
      </header>
      <nav className="nexus-dashboard__nav" aria-label="数据看板导航">
        <Link to="">概览</Link>
        <Link to="details">运行时详情</Link>
      </nav>
      <Outlet />
    </div>
  );
};

export default Layout;
