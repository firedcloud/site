/**
 *
 * @author Bichi Kim [bichi@pjfactory.com]
 * @copyright (c) PJ Factory Co.
 * @license Private
 */
const path = require('path')
const webpack = require('webpack')
const {CheckerPlugin} = require('awesome-typescript-loader')
function resolve (dir) {
  return path.join(__dirname, '..', dir)
}
module.exports = {
  entry: {
    app: ['./src/index.ts']
  },
  output: {
    path: resolve('dist'),
    filename: '[name].js',
    pathinfo: true,
  },
  resolve: {
    extensions: ['.js', '.ts'],
    alias: {
      '@': resolve('src'),
    },
  },
  plugins: [
    new CheckerPlugin(),
    new webpack.DefinePlugin({
      // ... nothing to add so far
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      }
    ]
  },
/*  node:{
    // for joi using in node server
    net: 'empty',
  }*/
}
