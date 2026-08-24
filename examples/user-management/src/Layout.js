import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './styles.css';

const Layout = () => {
  return (
    <div className="nexus-users">
      <header className="nexus-users__header">
        <div>
          <span className="nexus-users__eyebrow">远程微应用 · user-management</span>
          <h1>人员与权限</h1>
        </div>
        <span className="nexus-users__count">2,418 名成员</span>
      </header>
      <nav className="nexus-users__nav" aria-label="用户管理导航">
        <Link to="">成员目录</Link>
        <Link to="details">权限详情</Link>
      </nav>
      <Outlet />
    </div>
  );
};

export default Layout;
