const path = require('path')
const resolve = function(_path){
  return path.join(__dirname, _path)
}

module.exports = {
  tags: {
    allowUnknownTags: false,
  },
  plugins: ['plugins/markdown'],
  source: {
    include: [resolve('src'), resolve('README.md')],
    includePattern: /\.js$/,
  },
  opts: {
    template: './node_modules/docdash',
    encoding: 'utf8',
    destination: path.join(__dirname, 'docs'),
    recurse: true,
    verbose: true,
  },
  babel: {
    extensions: ['js', 'es6', 'jsx'],
    presets: [
      [
        'env', {
          modules: false,
          targets: {
            browsers: [
              '> 1%',
              'last 2 versions',
              'not ie <= 8',
            ],
          },
        }],
      'stage-2', 'stage-3',
    ],
    plugins: ['transform-runtime'],
    env: {
      test: {
        presets: ['env', 'stage-2', 'stage-3'],
        plugins: ['istanbul'],
      },
    },
  },
  templates: {
    'cleverLinks': true,
    'default': {
      'staticFiles': {
        'include': [resolve('img')],
      },
    },
  },
  docdash: {
    'static': true,
    'sort': true,
    'search': true,
  },
}
