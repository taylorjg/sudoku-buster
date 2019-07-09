/* eslint-env node */

const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { version } = require('./package.json')

const distFolder = path.join(__dirname, 'dist')

module.exports = {
  mode: 'production',
  entry: './src/web/index.js',
  output: {
    path: distFolder,
    filename: 'bundle.js'
  },
  plugins: [
    new CopyWebpackPlugin([
      { context: './src/web', from: '*.html' },
      { context: './src/web', from: '*.css' }
    ]),
    new HtmlWebpackPlugin({
      template: './src/web/index.html',
      version
    })
  ],
  devtool: 'source-map',
  devServer: {
    contentBase: distFolder
  }
}
