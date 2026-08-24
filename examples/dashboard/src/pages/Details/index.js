import React, { useState } from 'react';
import { publish } from '@mf/shared-config';

const Details = () => {
  const [sent, setSent] = useState(false);

  const notifyHost = () => {
    publish({
      source: 'dashboard',
      type: 'dashboard:health-check',
      payload: { status: 'healthy', checkedAt: new Date().toISOString() },
    });
    setSent(true);
  };

  return (
    <main className="nexus-dashboard__details">
      <h2>远程运行时详情</h2>
      <p>这个页面展示了远程边界：主应用提供外壳，而当前微应用拥有自己的界面和路由。</p>
      <dl>
        <div><dt>远程名称</dt><dd>dashboard</dd></div>
        <div><dt>入口文件</dt><dd>remoteEntry.js</dd></div>
        <div><dt>挂载路由</dt><dd>/dashboard/*</dd></div>
        <div><dt>健康状态</dt><dd className="nexus-dashboard__healthy">正常</dd></div>
      </dl>
      <button type="button" onClick={notifyHost}>
        通知主应用当前健康状态
      </button>
      {sent && <p role="status">主应用通知已发送，请查看顶部事件状态。</p>}
    </main>
  );
};

export default Details;
