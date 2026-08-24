const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;
const { RemoteManifestPlugin } = require('./webpack.manifest.js');

const { PROD_BASE_PATH, ROUTER_BASENAME } = require('@mf/shared-config');

const prodConfig = {
  mode: 'production',
  output: {
    filename: '[name].[contenthash].js',
    publicPath: PROD_BASE_PATH,
  },
  plugins: [
    new RemoteManifestPlugin({
      dashboard: {
        name: 'dashboard',
        version: '1.0.0',
        entry: `${PROD_BASE_PATH}dashboard/remoteEntry.js`,
        basename: `${ROUTER_BASENAME}/dashboard`.replace('//', '/'),
        scope: 'dashboard',
        exposedModule: './App',
      },
      user_management: {
        name: 'user_management',
        version: '1.0.0',
        entry: `${PROD_BASE_PATH}user-management/remoteEntry.js`,
        basename: `${ROUTER_BASENAME}/user-management`.replace('//', '/'),
        scope: 'user_management',
        exposedModule: './App',
      },
      settings: {
        name: 'settings',
        version: '1.0.0',
        entry: `${PROD_BASE_PATH}settings/remoteEntry.js`,
        basename: `${ROUTER_BASENAME}/settings`.replace('//', '/'),
        scope: 'settings',
        exposedModule: './App',
      },
    }),
    new ModuleFederationPlugin({
      name: 'main_app',
      remotes: {
        dashboard: `dashboard@${PROD_BASE_PATH}dashboard/remoteEntry.js`,
        settings: `settings@${PROD_BASE_PATH}settings/remoteEntry.js`,
        user_management: `user_management@${PROD_BASE_PATH}user-management/remoteEntry.js`,
      },
      shared: {
        react: { singleton: true, requiredVersion: deps.react },
        'react-dom': { singleton: true, requiredVersion: deps['react-dom'] },
        'react-router-dom': { singleton: true, requiredVersion: deps['react-router-dom'] },
        '@arco-design/web-react': { singleton: true, requiredVersion: deps['@arco-design/web-react'] },
      },
    }),
  ],
};

module.exports = merge(common, prodConfig);
