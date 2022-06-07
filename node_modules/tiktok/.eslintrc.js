module.exports = {
  parser: 'typescript-eslint-parser',
  plugins: ['html', 'vue', 'typescript'],
  env: {
    'browser': true,
    'es6': true,
    'amd': true,
  },
  extends: ['eslint:recommended', 'plugin:vue-libs/recommended'],
  'parserOptions': {
    'sourceType': 'module',
  },
  'rules': {
    'vue/jsx-uses-vars': 'error',
    'max-len': ['error', 100],
    'one-var': 'off',
    'no-undef': 'off',
    'no-console': 'off',
    'indent': 'off', // disable since bug in comment
    'linebreak-style': 'off',
    'comma-dangle': ['error', 'always-multiline'],
    'camelcase': 'off',
    'space-before-blocks': ['error', 'never'],
    'func-style': ['error', 'declaration', {'allowArrowFunctions': true }],
    'block-spacing': ['error', 'never'],
    'object-curly-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', {
      "anonymous": "never",
      "named": "never",
      "asyncArrow": "always"
    }],
    'keyword-spacing': ['error', {
      'before': false,
      'after': false,
      'overrides': {
        'const' : {
          before: true,
          after: true,
        },
        'from': {
          before: true,
          after: true,
        },
        'import': {
          before: true,
          after: true,
        },
        'as': {
          before: true,
          after: true,
        },
        'return': {
          before: true,
          after: true,
        },
        'this': {
          before: true,
          after: true,
        },
        'case':{
          after: true,
        },
        'extends': {
          before: true,
        },
        'implements': {
          before: true,
        },
        'export': {
          after: true,
        }
      }
    }],
    // type script
    'typescript/adjacent-overload-signatures': 'error',
    'typescript/class-name-casing': 'error',
    'typescript/explicit-member-accessibility': 'off',
    'typescript/interface-name-prefix': ['error', 'always'],
    'typescript/member-delimiter-style': 'off',
    'typescript/member-naming': ['error', {'private': '^_', 'protected': '^_'}],
    'typescript/member-ordering': 'off',
    'typescript/no-angle-bracket-type-assertion': 'error',
    'typescript/no-array-constructor': 'error',
    'typescript/no-empty-interface': 'off',
    'typescript/no-explicit-any': 'off',
    'typescript/no-namespace': 'error',
    'typescript/no-parameter-properties': 'error',
    'typescript/no-triple-slash-reference': 'error',
    'typescript/no-type-alias': 'off',
    'typescript/no-unused-vars': 'error',
    'typescript/no-use-before-define ': 'off',
    'typescript/type-annotation-spacing': ['error', {
      before: false,
      after: false,
      overrides: {
        arrow: {
          before: true,
          after: true,
        }
      }
    }],



  }
};
