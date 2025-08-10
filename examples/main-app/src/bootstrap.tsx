import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@arco-design/web-react/dist/css/arco.css';

const basename = process.env.NODE_ENV === 'production' ? '/mf' : '/';

// The main application is a standard React app and no longer initializes Garfish
const AppWrapper = () => (
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>
);

const rootElement = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(rootElement);

root.render(<AppWrapper />);
