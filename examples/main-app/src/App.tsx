import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Spin } from '@arco-design/web-react';
import { IconHome, IconDashboard, IconUser, IconSettings } from '@arco-design/web-react/icon';
import NotFound from './NotFound';
import { SandboxMFE } from '@nexus-mf/core';
import type { RemoteManifest, SandboxMFEFallbackContext, SandboxMFELoadContext } from '@nexus-mf/core';
import { ROUTER_BASENAME, subscribe } from '@mf/shared-config';
import type { NexusMFMessage } from '@mf/shared-config';

const { Header, Sider, Content } = Layout;

interface AppProps {
  manifest: RemoteManifest;
}

type RuntimeStatus = 'loading' | 'ready' | 'fallback' | 'error';

interface RuntimeState {
  status: RuntimeStatus;
  loadedVersion?: string;
  attemptingVersion?: string;
  usedFallback?: boolean;
  error?: string;
}

interface RuntimeDiagnosticsProps {
  remote: RemoteManifest[string];
  state: RuntimeState;
}

const statusCopy: Record<RuntimeStatus, { label: string; color: string }> = {
  loading: { label: '加载中', color: '#ff7d00' },
  ready: { label: '就绪', color: '#00b42a' },
  fallback: { label: '尝试回退版本', color: '#165dff' },
  error: { label: '错误', color: '#f53f3f' },
};

const RuntimeDiagnostics: React.FC<RuntimeDiagnosticsProps> = ({ remote, state }) => {
  const status = statusCopy[state.status];
  const displayedStatus = state.usedFallback
    ? { label: '就绪 · 已回退', color: '#00b42a' }
    : status;
  const fallbackCount = remote.fallbackVersions?.length ?? 0;
  const loadedVersion = state.loadedVersion || state.attemptingVersion || 'pending';

  return (
    <section
      aria-label={`${remote.name} 运行时诊断`}
      style={{
        marginBottom: 16,
        padding: '14px 16px',
        borderRadius: 8,
        background: 'var(--color-bg-2)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong>运行时诊断</strong>
            <span style={{ color: displayedStatus.color, fontSize: 13, fontWeight: 600 }}>● {displayedStatus.label}</span>
          </div>
          <div style={{ marginTop: 4, color: 'var(--color-text-2)', fontSize: 12 }}>
            该面板由运行时 Manifest 与 SandboxMFE 生命周期回调驱动。
          </div>
        </div>
        <span style={{ color: 'var(--color-text-2)', fontSize: 12 }}>微应用：{remote.name}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 14 }}>
        <div><small style={{ color: 'var(--color-text-3)' }}>Manifest</small><div>已加载 · {remote.version}</div></div>
        <div><small style={{ color: 'var(--color-text-3)' }}>实际版本</small><div>{loadedVersion}</div></div>
        <div><small style={{ color: 'var(--color-text-3)' }}>回滚版本</small><div>{fallbackCount ? `${fallbackCount} 个回退版本` : '未配置'}</div></div>
        <div><small style={{ color: 'var(--color-text-3)' }}>CSS 生命周期</small><div>已追踪 · 卸载时清理</div></div>
        <div><small style={{ color: 'var(--color-text-3)' }}>通信协议</small><div>类型化发布 / 订阅</div></div>
        <div><small style={{ color: 'var(--color-text-3)' }}>暴露模块</small><div>{remote.exposedModule || './App'}</div></div>
      </div>
      {fallbackCount === 0 && (
        <div style={{ marginTop: 10, color: 'var(--color-text-3)', fontSize: 12 }}>
          回滚能力已启用；当前示例没有配置旧版本入口，因此使用主版本。
        </div>
      )}
      {state.usedFallback && (
        <div style={{ marginTop: 10, color: '#00b42a', fontSize: 12 }}>
          本次加载已验证回退链路，实际使用的是可用的旧版本入口。
        </div>
      )}
      {state.error && (
        <div style={{ marginTop: 10, color: '#f53f3f', fontSize: 12 }}>最近一次运行时错误：{state.error}</div>
      )}
    </section>
  );
};

const App: React.FC<AppProps> = ({ manifest }) => {
  const location = useLocation();
  const [lastEvent, setLastEvent] = useState<NexusMFMessage | null>(null);
  const [runtimeStates, setRuntimeStates] = useState<Record<string, RuntimeState>>({});

  useEffect(() => subscribe<NexusMFMessage>(setLastEvent), []);

  const rollbackDemo = location.search.includes('rollback=1');
  const dashboardFallbackVersions = useMemo(() => {
    const dashboard = manifest.remotes.dashboard;
    return rollbackDemo && dashboard
      ? [{ version: dashboard.version, url: dashboard.entry, integrity: dashboard.integrity }, ...(dashboard.fallbackVersions ?? [])]
      : dashboard?.fallbackVersions;
  }, [manifest.remotes.dashboard, rollbackDemo]);

  const updateRuntimeState = (key: string, state: RuntimeState) => {
    setRuntimeStates((current) => ({ ...current, [key]: state }));
  };

  const renderRemote = (key: string) => {
    const remote = manifest.remotes[key];
    if (!remote || remote.enabled === false) return <NotFound />;

    const isRollbackDemo = key === 'dashboard' && rollbackDemo;
    const fallbackVersions = key === 'dashboard' ? dashboardFallbackVersions : remote.fallbackVersions;
    const entry = isRollbackDemo ? 'http://localhost:3999/remoteEntry.js' : remote.entry;
    const version = isRollbackDemo ? `${remote.version}-故障演示` : remote.version;

    return (
      <div>
        <RuntimeDiagnostics remote={{ ...remote, fallbackVersions }} state={runtimeStates[key] || { status: 'loading' }} />
        <SandboxMFE
          name={remote.name}
          url={entry}
          version={version}
          integrity={isRollbackDemo ? undefined : remote.integrity}
          fallbackVersions={fallbackVersions}
          exposedModule={remote.exposedModule}
          basename={remote.basename}
          timeout={isRollbackDemo ? 1500 : undefined}
          onLoad={(context: SandboxMFELoadContext) => updateRuntimeState(key, {
            status: 'ready',
            loadedVersion: context.version,
            usedFallback: context.usedFallback,
          })}
          onFallback={(context: SandboxMFEFallbackContext) => updateRuntimeState(key, {
            status: 'fallback',
            attemptingVersion: context.next.version,
            error: context.error.message,
          })}
          onError={(error) => updateRuntimeState(key, {
            status: 'error',
            error: error.message,
          })}
        />
      </div>
    );
  };

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard') || path.startsWith(`${ROUTER_BASENAME}/dashboard`)) return '/dashboard';
    if (path.startsWith('/user-management') || path.startsWith(`${ROUTER_BASENAME}/user-management`)) return '/user-management';
    if (path.startsWith('/settings') || path.startsWith(`${ROUTER_BASENAME}/settings`)) return '/settings';
    return '/';
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider>
        <div style={{ height: 32, margin: 12, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', lineHeight: '32px', color: 'white', borderRadius: 4 }}>
          微前端平台
        </div>
        <Menu theme='dark' selectedKeys={[getSelectedKey()]} style={{ width: '100%' }}>
          <Menu.Item key="/">
            <Link to="/"><IconHome />首页</Link>
          </Menu.Item>
          <Menu.Item key="/dashboard">
            <Link to="/dashboard"><IconDashboard />数据看板</Link>
          </Menu.Item>
          <Menu.Item key="/user-management">
            <Link to="/user-management"><IconUser />用户管理</Link>
          </Menu.Item>
          <Menu.Item key="/settings">
            <Link to="/settings"><IconSettings />工作区设置</Link>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ paddingLeft: 20, paddingRight: 20, background: 'var(--color-bg-2)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0 }}>Nexus MF · 主应用</h2>
              <span style={{ color: 'var(--color-text-3)', fontSize: 12 }}>Manifest 已加载 · {Object.keys(manifest.remotes).length} 个微应用</span>
            </div>
            {lastEvent && (
              <span style={{ color: 'var(--color-text-2)', fontSize: 13 }}>
                最近事件：{lastEvent.source || 'micro-app'} / {lastEvent.type || 'message'}
              </span>
            )}
        </Header>
        <Content style={{ padding: '24px', margin: 0, background: 'var(--color-bg-1)', overflowY: 'auto' }}>
          <Suspense fallback={<div style={{textAlign: 'center', marginTop: 100}}><Spin size={40} /></div>}>
            <Routes>
              <Route path="/" element={(
                <div>
                  <h1 style={{ marginTop: 0 }}>微前端平台</h1>
                  <p style={{ color: 'var(--color-text-2)', maxWidth: 720 }}>
                    三个独立构建的微应用由运行时 Remote Manifest 描述，并在访问路由时按需加载 remoteEntry.js。
                    打开任意应用，可以看到路由、版本信息、样式隔离和主应用通信。
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 24 }}>
                    {[
                      ['运行时加载', '只有访问对应路由时，才会加载远程入口文件。'],
                      ['独立路由', '每个微应用都拥有自己的概览页和详情页路由。'],
                      ['版本回滚', '加载器支持按顺序尝试回退版本，当前示例使用主版本。'],
                      ['CSS 生命周期', '追踪远程注入的样式，并在最后一个应用实例卸载时清理。'],
                      ['类型化事件协议', '通过带类型和命名空间的浏览器事件与主应用通信。'],
                    ].map(([title, description]) => (
                      <div key={title} style={{ padding: 20, borderRadius: 8, background: 'var(--color-bg-2)', border: '1px solid var(--color-border)' }}>
                        <h3 style={{ margin: '0 0 8px' }}>{title}</h3>
                        <p style={{ margin: 0, color: 'var(--color-text-2)', lineHeight: 1.6 }}>{description}</p>
                      </div>
                    ))}
                  </div>
                  <section style={{ marginTop: 24, padding: 20, borderRadius: 8, background: 'var(--color-bg-2)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0 }}>远程 Manifest</h2>
                      <span style={{ color: 'var(--color-text-2)', fontSize: 12 }}>契约 v{manifest.schemaVersion} · <code>/remote-manifest.json</code></span>
                    </div>
                    <p style={{ color: 'var(--color-text-2)', marginBottom: 16 }}>
                      这些微应用配置会在运行时解析。打开对应路由后，可以看到 remoteEntry 加载和实时生命周期状态。
                    </p>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {Object.entries(manifest.remotes).map(([key, remote]) => (
                        <div key={key} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(120px, 1fr) minmax(180px, 2fr)', gap: 12, alignItems: 'center', padding: '10px 12px', borderRadius: 6, background: 'var(--color-fill-1)' }}>
                          <div><Link to={remote.basename}>{remote.name} <span style={{ color: 'var(--color-text-3)', fontSize: 12 }}>({key})</span></Link>{key === 'dashboard' && <div><Link to="/dashboard?rollback=1" style={{ color: '#165dff', fontSize: 12 }}>演示版本回滚</Link></div>}</div>
                          <span>v{remote.version} · {remote.fallbackVersions?.length ?? 0} 个回退版本</span>
                          <code style={{ color: 'var(--color-text-2)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{remote.entry}</code>
                        </div>
                      ))}
                    </div>
                  </section>
                  {lastEvent && (
                    <pre style={{ marginTop: 24, padding: 16, borderRadius: 8, background: 'var(--color-fill-2)', overflow: 'auto' }}>
                      {JSON.stringify(lastEvent, null, 2)}
                    </pre>
                  )}
                </div>
              )} />
              <Route path="/dashboard/*" element={renderRemote('dashboard')} />
              <Route path="/user-management/*" element={renderRemote('user_management')} />
              <Route path="/settings/*" element={renderRemote('settings')} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
