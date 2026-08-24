import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './styles.css';

const Layout = () => {
  return (
    <div className="nexus-settings">
      <header className="nexus-settings__header">
        <div>
          <span className="nexus-settings__eyebrow">远程微应用 · settings</span>
          <h1>工作区设置</h1>
        </div>
        <span className="nexus-settings__version">v1.0.0</span>
      </header>
      <nav className="nexus-settings__nav" aria-label="设置导航">
        <Link to="">偏好设置</Link>
        <Link to="details">运行时契约</Link>
      </nav>
      <Outlet />
    </div>
  );
};

export default Layout;
