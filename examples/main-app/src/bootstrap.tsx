import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { loadRemoteManifest } from '@nexus-mf/core';
import App from './App';
import '@arco-design/web-react/dist/css/arco.css';
import { PROD_BASE_PATH, ROUTER_BASENAME } from '@mf/shared-config';

// The main application is a standard React app and no longer initializes Garfish
const AppWrapper = ({ manifest }: { manifest: Awaited<ReturnType<typeof loadRemoteManifest>> }) => (
  <BrowserRouter basename={ROUTER_BASENAME}>
    <App manifest={manifest} />
  </BrowserRouter>
);

const rootElement = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(rootElement);

const manifestUrl = `${ROUTER_BASENAME === '/' ? '' : ROUTER_BASENAME}/remote-manifest.json`;
const allowedRemoteOrigins = ROUTER_BASENAME === '/'
  ? ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003']
  : [new URL(PROD_BASE_PATH).origin];

const bootstrap = async () => {
  try {
    const manifest = await loadRemoteManifest(manifestUrl, {
      allowedOrigins: allowedRemoteOrigins,
      requireHttps: ROUTER_BASENAME !== '/',
    });
    root.render(<AppWrapper manifest={manifest} />);
  } catch (error) {
    root.render(
      <div role="alert" style={{ padding: 32, fontFamily: 'sans-serif' }}>
        远程 Manifest 加载失败：{error instanceof Error ? error.message : String(error)}
      </div>,
    );
  }
};

void bootstrap();
