/* eslint-env node */

const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { version } = require('./package.json')

const distFolder = path.join(__dirname, 'dist')

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    index: './src/index.js',
    analysis: './analysis/index.js',
    test: './test/index.js'
  },
  output: {
    path: distFolder,
    filename: '[name].bundle.js'
  },
  plugins: [
    new CopyWebpackPlugin([
      { context: './src', from: '*.css' },
      { context: './src', from: 'opencv.js' },
      { from: './models', to: 'models/' },
      { from: './rawImages', to: 'rawImages/' }
    ]),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: path.resolve(distFolder, 'index.html'),
      chunks: ['index'],
      version
    }),
    new HtmlWebpackPlugin({
      template: './analysis/index.html',
      filename: path.resolve(distFolder, 'analysis.html'),
      chunks: ['analysis'],
      version
    }),
    new HtmlWebpackPlugin({
      template: './test/index.html',
      filename: path.resolve(distFolder, 'test.html'),
      chunks: ['test'],
      version
    })
  ],
  devtool: 'source-map',
  devServer: {
    contentBase: distFolder,
    proxy: {
      '/api': 'http://localhost:3090'
    }
  }
}
