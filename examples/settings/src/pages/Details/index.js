import React from 'react';

const Details = () => {
  return (
    <main className="nexus-settings__details">
      <h2>运行时契约</h2>
      <p>这个远程微应用暴露自己的路由，并使用共享事件协议，不需要直接引用其他微应用。</p>
      <div className="nexus-settings__contract">
        <code>settings:theme-changed</code>
        <span>payload.theme：light | dark</span>
      </div>
      <div className="nexus-settings__contract">
        <code>nexus-settings__*</code>
        <span>带前缀的 class 可以避免这个示例的 CSS 与其他微应用发生冲突。</span>
      </div>
    </main>
  );
};

export default Details;
