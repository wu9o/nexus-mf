const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

// 假设部署在 https://wujiuli.github.io/mf/
const DEPLOY_URL = 'https://wujiuli.github.io/mf/';

module.exports = merge(common, {
  mode: 'production',
  output: {
    filename: '[name].[contenthash].js',
    publicPath: `${DEPLOY_URL}settings/`,
  },
});
