import React, { useMemo, useState } from 'react';

const Overview = () => {
  const [query, setQuery] = useState('');
  const users = [
    { name: 'Ava Chen', email: 'ava@example.com', role: '管理员', status: 'active', statusLabel: '正常' },
    { name: 'Marcus Lee', email: 'marcus@example.com', role: '编辑者', status: 'active', statusLabel: '正常' },
    { name: 'Sofia Wang', email: 'sofia@example.com', role: '查看者', status: 'invited', statusLabel: '待邀请' },
    { name: 'Noah Smith', email: 'noah@example.com', role: '编辑者', status: 'suspended', statusLabel: '已暂停' },
  ];
  const filteredUsers = useMemo(() => users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())), [query]);

  return (
    <main>
      <div className="nexus-users__toolbar">
        <div>
          <h2>团队成员目录</h2>
          <p>这是 user-management 远程微应用内部维护的界面状态。</p>
        </div>
        <input aria-label="搜索用户" placeholder="搜索人员" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <section className="nexus-users__table" aria-label="成员目录">
        <div className="nexus-users__table-head"><span>成员</span><span>角色</span><span>状态</span></div>
        {filteredUsers.map((user) => (
          <div className="nexus-users__row" key={user.email}>
            <div><strong>{user.name}</strong><small>{user.email}</small></div>
            <span>{user.role}</span>
            <span className={`nexus-users__status nexus-users__status--${user.status}`}>{user.statusLabel}</span>
          </div>
        ))}
        {filteredUsers.length === 0 && <p className="nexus-users__empty">没有匹配的用户。</p>}
      </section>
    </main>
  );
};

export default Overview;
