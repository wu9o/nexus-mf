import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@arco-design/web-react/dist/css/arco.css';

// 主应用就是一个标准的 React 应用，不再初始化 Garfish
const AppWrapper = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AppWrapper />);
