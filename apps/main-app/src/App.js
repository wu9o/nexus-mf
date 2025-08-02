import React, { Suspense } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Spin } from '@arco-design/web-react';
import { IconHome, IconDashboard, IconUser, IconSettings } from '@arco-design/web-react/icon';
import NotFound from './NotFound';

const { Header, Sider, Content } = Layout;

// Use React.lazy for native, stable module federation
const DashboardApp = React.lazy(() => import('dashboard/App'));
const UserManagementApp = React.lazy(() => import('user_management/App'));
const SettingsApp = React.lazy(() => import('settings/App'));

const App = () => {
  const location = useLocation();

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return '/dashboard';
    if (path.startsWith('/user-management')) return '/user-management';
    if (path.startsWith('/settings')) return '/settings';
    return '/';
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider>
        <div style={{ height: 32, margin: 12, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', lineHeight: '32px', color: 'white', borderRadius: 4 }}>
          MF Platform
        </div>
        <Menu theme='dark' selectedKeys={[getSelectedKey()]} style={{ width: '100%' }}>
          <Menu.Item key="/">
            <Link to="/"><IconHome />Home</Link>
          </Menu.Item>
          <Menu.Item key="/dashboard">
            <Link to="/dashboard"><IconDashboard />Dashboard</Link>
          </Menu.Item>
          <Menu.Item key="/user-management">
            <Link to="/user-management"><IconUser />User Management</Link>
          </Menu.Item>
          <Menu.Item key="/settings">
            <Link to="/settings"><IconSettings />Settings</Link>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ paddingLeft: 20, background: 'var(--color-bg-2)', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ margin: 0 }}>Micro-Frontend with Arco Design</h2>
        </Header>
        <Content style={{ padding: '24px', margin: 0, background: 'var(--color-bg-1)', overflowY: 'auto' }}>
          <Suspense fallback={<div style={{textAlign: 'center', marginTop: 100}}><Spin size={40} /></div>}>
            <Routes>
              <Route path="/" element={<h1>Welcome to the Main Platform!</h1>} />
              <Route path="/dashboard/*" element={<DashboardApp />} />
              <Route path="/user-management/*" element={<UserManagementApp />} />
              <Route path="/settings/*" element={<SettingsApp />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;