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
      remotes: {
        dashboard: 'dashboard@http://localhost:3001/remoteEntry.js',
        user_management: 'user_management@http://localhost:3002/remoteEntry.js',
        settings: 'settings@http://localhost:3003/remoteEntry.js',
      },
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

module.exports = merge(common, devConfig);
