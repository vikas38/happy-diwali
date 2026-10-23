import hooks from 'eslint-plugin-react-hooks'
import react from 'eslint-plugin-react'

export default [
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': hooks,
      react,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-undef': 'error',
    },
    settings: {
      react: {
        version: '18.3',
      },
    },
  },
]
