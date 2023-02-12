import metarhia from 'eslint-config-metarhia';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

const metarhiaRules = metarhia.extends.slice(1)
  .reduce((all, { rules }) => Object.assign(all, rules), {});

export default [
  'eslint:recommended',
  {
    rules: {
      ...metarhiaRules,
      'semi': 'error',
      'no-trailing-spaces': ['error', { skipBlankLines: true }],
      'no-unused-vars': [
        'error',
        { ignoreRestSiblings: true, argsIgnorePattern: '^_' },
      ],
      'max-len': [
        'error',
        {
          code: 80,
          ignoreUrls: true,
        },
      ],
      'arrow-parens': ['error', 'always'],
      'no-extra-parens': ['error', 'functions'],
      'operator-linebreak': [
        'error',
        'after',
        {
          overrides: {
            '?': 'before',
            ':': 'before',
            '&&': 'before',
            '||': 'before',
            '??': 'before',
          },
        },
      ],
      'handle-callback-err': 'off',
      'consistent-return': 'off',
      'class-methods-use-this': 'off',
      'comma-dangle': ['error', 'always-multiline'],
      'quotes': ['error', 'single', { allowTemplateLiterals: true }],
      'quote-props': ['error', 'consistent-as-needed'],
      'max-params': ['error', 4],
      'arrow-body-style': ['error', 'as-needed'],
      'generator-star-spacing': ['error', { before: true, after: false }],
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.nodeBuiltin,
        globalThis: 'readonly',
      },
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      ...ts.configs.recommended.rules,
      ...ts.configs['recommended-requiring-type-checking'].rules,
      'no-undef': 'off',
    },
  },
];
