import React, { useState } from 'react';
import { publish } from '@mf/shared-config';

const Overview = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [compactMode, setCompactMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const updateTheme = (enabled) => {
    setDarkMode(enabled);
    publish({ source: 'settings', type: 'settings:theme-changed', payload: { theme: enabled ? 'dark' : 'light' } });
  };

  return (
    <main>
      <h2>偏好设置</h2>
      <p className="nexus-settings__intro">这是一个自包含的设置页面，同时演示了清晰、明确的事件契约。</p>
      <section className="nexus-settings__panel">
        <label><span><strong>深色模式</strong><small>向主应用发布主题变更事件。</small></span><input type="checkbox" checked={darkMode} onChange={(event) => updateTheme(event.target.checked)} /></label>
        <label><span><strong>紧凑布局</strong><small>让密集的表格和卡片更容易浏览。</small></span><input type="checkbox" checked={compactMode} onChange={(event) => setCompactMode(event.target.checked)} /></label>
        <label><span><strong>通知</strong><small>接收工作区活动更新。</small></span><input type="checkbox" checked={notifications} onChange={(event) => setNotifications(event.target.checked)} /></label>
      </section>
      <div className="nexus-settings__preview" data-compact={compactMode} data-dark={darkMode}>
        <strong>预览</strong>
        <span>{darkMode ? '深色' : '浅色'}主题 · {compactMode ? '紧凑' : '舒适'}密度 · 通知{notifications ? '开启' : '关闭'}</span>
      </div>
    </main>
  );
};

export default Overview;
