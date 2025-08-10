const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;

const { PROD_BASE_PATH } = require('@mf/shared-config');

const prodConfig = {
  mode: 'production',
  output: {
    filename: '[name].[contenthash].js',
    publicPath: PROD_BASE_PATH,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'main_app',
      remotes: {
        dashboard: `dashboard@${PROD_BASE_PATH}dashboard/remoteEntry.js`,
        settings: `settings@${PROD_BASE_PATH}settings/remoteEntry.js`,
        user_management: `user_management@${PROD_BASE_PATH}user_management/remoteEntry.js`,
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
