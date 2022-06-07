/**
 *
 * @author Bichi Kim [bichi@pjfactory.com]
 * @copyright (c) PJ Factory Co.
 * @license Private
 */
const WebpackBaseConfig = require('./webpack.base.conf')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: WebpackBaseConfig.entry,
  output: WebpackBaseConfig.output,
  resolve: WebpackBaseConfig.resolve,
  plugins: WebpackBaseConfig.plugins,
  module: {
    rules: [
      ...WebpackBaseConfig.module.rules,
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'awesome-typescript-loader',
            options: {
              appendTsSuffixTo: [/\.vue$/]
            }
          },
        ],
      },
    ],
  }
}