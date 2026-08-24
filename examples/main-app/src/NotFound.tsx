// src/NotFound.js
import React from 'react';
import { Result, Button } from '@arco-design/web-react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <Result
      status='404'
      subTitle='抱歉，你访问的页面不存在。'
      extra={<Button type='primary' onClick={() => navigate('/')}>返回首页</Button>}
    />
  );
};

export default NotFound;
