const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

const { PROD_BASE_PATH } = require('@mf/shared-config');

module.exports = merge(common, {
  mode: 'production',
  output: {
    filename: '[name].[contenthash].js',
    publicPath: `${PROD_BASE_PATH}dashboard/`,
  },
});
