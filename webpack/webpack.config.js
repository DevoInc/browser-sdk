'use strict';

const path = require('path');
console.log('process.env.NODE_ENV', process.env.NODE_ENV);

module.exports = {
  entry: {
    // 'query-bundle': path.join(__dirname, '..', 'lib', 'index.js'),
    'BrowserSdk': path.join(__dirname, '..', 'index.js'),
    'examples': path.join(__dirname, '..', 'examples', 'index.js')
  },
  module: {
    rules: [
      {
        test: /\.js(x?)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/, use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(gif|svg|jpg|png)$/, use: [{
          loader: 'file-loader',
          options: {
            name: 'img/[name].[ext]?[hash]',
          }
        }]
      },
      {
        test: /\.scss$/,
        use: [
          {loader: 'style-loader'}, // creates style nodes from JS strings
          {loader: 'css-loader'}, // translates CSS into CommonJS
          {loader: 'sass-loader'} // compiles Sass to CSS
        ]
      },
      {
        test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/'
          }
        }]
      }
    ]
  }
};
