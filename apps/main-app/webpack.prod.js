const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;

const prodConfig = {
  mode: 'production',
  output: {
    filename: '[name].[contenthash].js',
    publicPath: '/mf/',
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'main_app',
      // REMOTES ARE NO LONGER NEEDED HERE
      shared: {
        react: {
          singleton: true,
          requiredVersion: deps.react,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: deps['react-dom'],
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: deps['react-router-dom'],
        },
        '@arco-design/web-react': {
          singleton: true,
          requiredVersion: deps['@arco-design/web-react'],
        }
      },
    }),
  ],
};

module.exports = merge(common, prodConfig);
