/* eslint-env node */

const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { version } = require('./package.json')

const distFolder = path.join(__dirname, 'dist')

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/index.js',
  output: {
    path: distFolder,
    filename: 'bundle.js'
  },
  plugins: [
    new CopyWebpackPlugin([
      { context: './src', from: '*.html' },
      { context: './src', from: '*.css' },
      { context: './src', from: 'opencv_4.1.1.js' },
      { from: './models', to: 'models/' }
    ]),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      version
    })
  ],
  devtool: 'source-map',
  devServer: {
    contentBase: distFolder
  }
}
