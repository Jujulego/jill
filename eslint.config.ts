import eslint from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  {
    ignores: ['.pnp.*', '.yarn', 'coverage', 'dist']
  },
  {
    languageOptions: {
      globals: globals.node,
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    }
  },
  /* Javascript/Typescript/React rules */
  eslint.configs.recommended,
  tsEslint.configs.recommendedTypeChecked
    .map((cfg) => ({ ...cfg, files: ['**/*.{js,jsx,ts,tsx}'] })),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ...react.configs.flat.recommended,
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ...react.configs.flat['jsx-runtime'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ...reactHooks.configs['recommended-latest'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: 'detect',
      }
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-empty-object-type': ['error', {
        allowInterfaces: 'with-single-extends'
      }],
      '@typescript-eslint/no-unused-expressions': ['error', {
        allowTaggedTemplates: true
      }],
      'no-console': ['error', {
        allow: ['warn', 'error'],
      }],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
    }
  },
  /* Vitest rules */
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.test-d.{ts,tsx}'],
    plugins: {
      vitest
    },
    settings: {
      vitest: {
        typecheck: true
      }
    },
    rules: {
      ...vitest.configs.recommended.rules,
    }
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.test-d.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': ['off'],
      '@typescript-eslint/no-unused-vars': ['off'],
      '@typescript-eslint/prefer-promise-reject-errors': ['off'],
      '@typescript-eslint/require-await': ['off'],
      '@typescript-eslint/unbound-method': ['off'],
    }
  },
  {
    files: ['**/*.test-d.{ts,tsx}'],
    rules: {
      'vitest/expect-expect': ['error', {
        assertFunctionNames: ['expectTypeOf', 'assertType']
      }],
    }
  }
);
