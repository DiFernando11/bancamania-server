module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    project: './tsconfig.json',
    extraFileExtensions: ['.json'],
  },
  ignorePatterns: ['**/*.json'],
  plugins: [
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint',
    'prettier',
    'json',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:json/recommended-legacy',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'prettier/prettier': 'error',
    'no-console': 'warn',
    'no-debugger': 'warn',
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error'],
      },
    ],
  },
}
