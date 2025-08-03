const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;

const devConfig = {
  mode: 'development',
  devServer: {
    port: 3000,
    historyApiFallback: true,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'main_app',
      // REMOTES ARE NO LONGER NEEDED HERE
      // 移除 shared 配置
    }),
  ],
};

module.exports = merge(common, devConfig);
