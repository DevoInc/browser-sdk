'use strict';

const merge = require('webpack-merge');
const baseConfig = require('./webpack.config');
const UglifyPlugin = require('uglifyjs-webpack-plugin');

const VERSION = require('../package.json').version;

module.exports = merge(baseConfig, {
  output: {
    library: 'BrowserSdk',
    libraryTarget: 'umd',
    auxiliaryComment: 'Rest API Library to access Devo Web Services',
    filename: `[name]-${VERSION}.js`
  },
  mode: 'production',
  optimization: {
    minimizer: [
      new UglifyPlugin({
        parallel: true,
        cache: true,
        uglifyOptions: {
          warnings: false
        },
        sourceMap: false
      })
    ]
  }
});
