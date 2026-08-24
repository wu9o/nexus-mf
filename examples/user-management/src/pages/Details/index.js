import React from 'react';

const Details = () => {
  return (
    <main className="nexus-users__details">
      <h2>权限模型</h2>
      <p>权限仍由这个独立部署的微应用负责，主应用只决定它挂载在哪个路由下。</p>
      <div className="nexus-users__permission-grid">
        {[
          ['管理员', '管理成员、角色和工作区设置'],
          ['编辑者', '创建和更新业务内容'],
          ['查看者', '查看数据看板和共享报表'],
        ].map(([role, description]) => <article key={role}><strong>{role}</strong><span>{description}</span></article>)}
      </div>
    </main>
  );
};

export default Details;
