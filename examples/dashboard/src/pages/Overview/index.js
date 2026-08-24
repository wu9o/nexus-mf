import React, { useState } from 'react';

const Overview = () => {
  const [refreshCount, setRefreshCount] = useState(0);
  const metrics = [
    ['活跃用户', '24,892', '+12.6%', 'positive'],
    ['请求 / 分钟', '8,421', '+8.4%', 'positive'],
    ['错误率', '0.18%', '-0.07%', 'positive'],
    ['月度收入', '$128.4K', '+4.2%', 'positive'],
  ];

  return (
    <main>
      <div className="nexus-dashboard__toolbar">
        <div>
          <h2>今日概览</h2>
          <p>业务数据由独立部署的远程微应用渲染。</p>
        </div>
        <button type="button" onClick={() => setRefreshCount((count) => count + 1)}>
          刷新数据 {refreshCount > 0 ? `(${refreshCount})` : ''}
        </button>
      </div>
      <section className="nexus-dashboard__metrics" aria-label="关键指标">
        {metrics.map(([label, value, change, tone]) => (
          <article className="nexus-dashboard__metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <em className={`nexus-dashboard__change nexus-dashboard__change--${tone}`}>{change} 较上一周期</em>
          </article>
        ))}
      </section>
      <section className="nexus-dashboard__activity">
        <h2>最近动态</h2>
        {['Checkout API · 可用性 99.98%', 'Billing worker · 已完成 1,248 个任务', 'Search index · 3 分钟前已同步'].map((item) => (
          <div className="nexus-dashboard__activity-row" key={item}>
            <span className="nexus-dashboard__dot" />
            <span>{item}</span>
            <time>刚刚</time>
          </div>
        ))}
      </section>
    </main>
  );
};

export default Overview;
