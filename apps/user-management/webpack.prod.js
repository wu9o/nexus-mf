const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

// 假设部署在 https://wu9o.github.io/mf/
const DEPLOY_URL = 'https://wu9o.github.io/mf/';

module.exports = merge(common, {
  mode: 'production',
  output: {
    filename: '[name].[contenthash].js',
    publicPath: `${DEPLOY_URL}user-management/`,
  },
});
