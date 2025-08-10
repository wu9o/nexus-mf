// src/NotFound.js
import React from 'react';
import { Result, Button } from '@arco-design/web-react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <Result
      status='404'
      subTitle='Sorry, the page you visited does not exist.'
      extra={<Button type='primary' onClick={() => navigate('/')}>Back Home</Button>}
    />
  );
};

export default NotFound;
