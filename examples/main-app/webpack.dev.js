const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;
const path = require('path');
const { RemoteManifestPlugin } = require('./webpack.manifest.js');

const devConfig = {
  mode: 'development',
  output: {
    publicPath: '/',
  },
  devServer: {
    port: 3000,
    historyApiFallback: true,
  },
  resolve: {
    alias: {
      '@nexus-mf/core': path.resolve(__dirname, '../../packages/core/src'),
    },
  },
  plugins: [
    new RemoteManifestPlugin({
      dashboard: {
        name: 'dashboard',
        version: '1.0.0',
        entry: 'http://localhost:3001/remoteEntry.js',
        basename: '/dashboard',
        scope: 'dashboard',
        exposedModule: './App',
      },
      user_management: {
        name: 'user_management',
        version: '1.0.0',
        entry: 'http://localhost:3002/remoteEntry.js',
        basename: '/user-management',
        scope: 'user_management',
        exposedModule: './App',
      },
      settings: {
        name: 'settings',
        version: '1.0.0',
        entry: 'http://localhost:3003/remoteEntry.js',
        basename: '/settings',
        scope: 'settings',
        exposedModule: './App',
      },
    }),
    new ModuleFederationPlugin({
      name: 'main_app',
      remotes: {}, // No remotes in dev, they are loaded dynamically in App.js
      shared: {
        react: { singleton: true, requiredVersion: deps.react },
        'react-dom': { singleton: true, requiredVersion: deps['react-dom'] },
        'react-router-dom': { singleton: true, requiredVersion: deps['react-router-dom'] },
        '@arco-design/web-react': { singleton: true, requiredVersion: deps['@arco-design/web-react'] },
      },
    }),
  ],
};

module.exports = merge(common, devConfig);
