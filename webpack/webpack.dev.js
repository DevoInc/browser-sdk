'use strict';

const path = require('path');
const merge = require('webpack-merge');
const baseConfig = require('./webpack.config');
const express = require('express');

module.exports = merge(baseConfig, {
  output: {
    library: '[name]',
    libraryTarget: 'umd',
    filename: '[name].js',
  },
  resolve: {
    alias: {
      //'@devo/browser-sdk': path.resolve(__dirname, '..', 'lib', 'index.js')
    }
  },
  devtool: 'eval-cheap-module-source-map',
  devServer: {
    // publicPath: '/',
    // historyApiFallback: true,
    contentBase: path.join(__dirname, '..', 'examples'),
    compress: true,
    port: 3001,
    before(app) {
      console.log('Setting up static resources');
      app.use('/credentials.json',
        express.static(path.join(__dirname, '..', 'credentials.json')));
    },
    stats: {
      assets: true,
      children: false,
      chunks: false,
      hash: true,
      modules: false,
      publicPath: false,
      timings: true,
      version: false,
      warnings: true
    }
  }
});
