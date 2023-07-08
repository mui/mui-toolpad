const baseline = require('@mui/monorepo/.eslintrc');

module.exports = {
  ...baseline,
  extends: [
    ...baseline.extends,
    // Motivation: https://github.com/shian15810/eslint-plugin-typescript-enum#motivations
    'plugin:typescript-enum/recommended',
  ],
  /**
   * Sorted alphanumerically within each group. built-in and each plugin form
   * their own groups.
   */
  rules: {
    ...baseline.rules,
    'import/prefer-default-export': ['off'],
    // TODO move rule into the main repo once it has upgraded
    '@typescript-eslint/return-await': ['off'],

    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@mui/icons-material',
            message: 'Use @mui/icons-material/<Icon> instead.',
          },
        ],
      },
    ],
    'no-restricted-syntax': [
      ...baseline.rules['no-restricted-syntax'].filter((rule) => {
        // Too opinionated for Toolpad
        return rule?.selector !== 'ForOfStatement';
      }),
    ],
    // Turning react/jsx-key back on.
    // https://github.com/airbnb/javascript/blob/5155aa5fc1ea9bb2c6493a06ddbd5c7a05414c86/packages/eslint-config-airbnb/rules/react.js#L94
    'react/jsx-key': ['error', { checkKeyMustBeforeSpread: true, warnOnDuplicates: true }],
    // This got turned of in the mono-repo:
    // See https://github.com/mui/mui-toolpad/pull/866#discussion_r957222171
    'react/no-unused-prop-types': [
      'error',
      {
        customValidators: [],
        skipShapeProps: true,
      },
    ],
    'import/no-restricted-paths': [
      // Disabling this rule for now, still need a few more refactors for it to pass
      'off',
      {
        zones: [
          {
            target: './packages/toolpad-app/src/runtime',
            from: './packages/toolpad-app/src/',
            except: ['./runtime', './appDom', './types.ts'],
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['packages/toolpad-app/**/*'],
      extends: ['plugin:@next/next/recommended'],
      rules: {
        '@next/next/no-html-link-for-pages': ['error', 'packages/toolpad-app/pages/'],
        '@next/next/no-img-element': 'off',
      },
    },
    {
      files: [
        'packages/create-toolpad-app/**/*',
        'packages/toolpad/**/*',
        'packages/toolpad-app/**/*',
        'packages/toolpad-utils/**/*',
        'packages/toolpad-core/**/*',
        'packages/toolpad-components/**/*',
      ],
      excludedFiles: [
        '**/jest-environment-jsdom.ts',
        'tsup.config.ts',
        '*.spec.ts',
        '*.spec.tsx',
        'jest.config.ts',
      ],
      rules: {
        'import/no-extraneous-dependencies': ['error'],
      },
    },
    {
      files: [
        /**
         * Basically all code that is guaranteed being bundled for the client side and never used on serverside code
         * can be dev dependencies to reduce the size of the published package
         */
        'packages/toolpad-app/src/components/**/*',
        'packages/toolpad-app/src/toolpad/**/*',
        'packages/toolpad-app/src/runtime/**/*',
        'packages/toolpad-app/reactDevtools/**/*',
      ],
      excludedFiles: ['*.spec.ts', '*.spec.tsx'],
      rules: {
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      },
    },
    {
      // Starting small, we will progressively expand this to more packages.
      files: [
        // 'packages/create-toolpad-app/**/*',
        // 'packages/toolpad/**/*',
        // 'packages/toolpad-app/**/*',
        'packages/toolpad-utils/**/*',
        // 'packages/toolpad-core/**/*',
        // 'packages/toolpad-components/**/*',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': ['error'],
      },
    },
    {
      files: ['packages/toolpad-app/pages/**/*'],
      rules: {
        // The pattern is useful to type Next.js pages
        'react/function-component-definition': 'off',
      },
    },
    {
      // Disabling this rule for now:
      // https://github.com/mui/material-ui/blob/9737bc85bb6960adb742e7709e9c3710c4b6cedd/.eslintrc.js#L359
      files: ['packages/*/src/**/*{.ts,.tsx,.js}'],
      excludedFiles: ['*.d.ts', '*.spec.ts', '*.spec.tsx'],
      rules: {
        'import/no-cycle': ['error', { ignoreExternal: true }],
      },
    },
  ],
};
