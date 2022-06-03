/**
 *
 * @author Bichi Kim [bichi@pjfactory.com]
 * @copyright (c) PJ Factory Co.
 * @license Private
 */
const WebpackBaseConfig = require('./webpack.base.conf')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
WebpackBaseConfig.output.libraryTarget = 'commonjs2' // 모듈로 만들 때는 이렇게 해야됨
module.exports = {
  entry: WebpackBaseConfig.entry,
  output: WebpackBaseConfig.output,
  resolve: WebpackBaseConfig.resolve,
  plugins: [...WebpackBaseConfig.plugins, new UglifyJsPlugin()],
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