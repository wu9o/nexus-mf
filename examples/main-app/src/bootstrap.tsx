import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@arco-design/web-react/dist/css/arco.css';
import { ROUTER_BASENAME } from '@mf/shared-config';

// The main application is a standard React app and no longer initializes Garfish
const AppWrapper = () => (
  <BrowserRouter basename={ROUTER_BASENAME}>
    <App />
  </BrowserRouter>
);

const rootElement = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(rootElement);

root.render(<AppWrapper />);
