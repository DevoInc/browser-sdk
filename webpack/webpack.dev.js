'use strict';

const path = require('path');
const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config');
const express = require('express');

module.exports = merge(baseConfig, {
  mode: 'development',
  output: {
    library: '[name]',
    libraryTarget: 'umd',
    filename: '[name].js',
  },
  devtool: 'eval-cheap-source-map',
  devServer: {
    // publicPath: '/',
    // historyApiFallback: true,
    compress: true,
    static: {
      directory: path.join(__dirname, '..', 'examples'),
      watch: false,
    },
    port: 3001,
    onBeforeSetupMiddleware(devServer) {
      console.log('Setting up static resources');
      devServer.app.use('/credentials.json',
        express.static(path.join(__dirname, '..', 'credentials.json')));
    }
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
});
