const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;

// 假设部署在 https://wu9o.github.io/mf/
const DEPLOY_URL = 'https://wu9o.github.io/mf/';

const prodConfig = {
  mode: 'production',
  output: {
    filename: '[name].[contenthash].js',
    publicPath: '/mf/',
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'main_app',
      remotes: {
        dashboard: `dashboard@${DEPLOY_URL}dashboard/remoteEntry.js`,
        settings: `settings@${DEPLOY_URL}settings/remoteEntry.js`,
        user_management: `user_management@${DEPLOY_URL}user_management/remoteEntry.js`,
      },
      shared: {
        ...deps,
        react: { singleton: true, requiredVersion: deps.react },
        'react-dom': { singleton: true, requiredVersion: deps['react-dom'] },
        'react-router-dom': { singleton: true, requiredVersion: deps['react-router-dom'] },
        '@arco-design/web-react': { singleton: true, requiredVersion: deps['@arco-design/web-react'] },
      },
    }),
  ],
};

module.exports = merge(common, prodConfig);