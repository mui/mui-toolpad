const baseline = require('@mui/monorepo/.eslintrc');

module.exports = {
  ...baseline,
  /**
   * Sorted alphanumerically within each group. built-in and each plugin form
   * their own groups.
   */
  rules: {
    ...baseline.rules,
    'import/prefer-default-export': ['off'],
    // TODO move rule into the main repo once it has upgraded
    '@typescript-eslint/return-await': ['off'],
    // TODO: resolve these, non critical for pathfinder prototype
    'no-alert': ['off'],
    'no-console': ['off'],
  },
  overrides: baseline.overrides.map((override) => {
    return {
      ...override,
      rules: {
        ...override.rules,
        'no-restricted-imports': ['off'],
        'no-restricted-syntax': [
          'error',
          // From https://github.com/airbnb/javascript/blob/d8cb404da74c302506f91e5928f30cc75109e74d/packages/eslint-config-airbnb-base/rules/style.js#L333
          {
            selector: 'ForInStatement',
            message:
              'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
          },
          // Too opinionated
          // {
          //   selector: 'ForOfStatement',
          //   message:
          //     'iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.',
          // },
          {
            selector: 'LabeledStatement',
            message:
              'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
          },
          {
            selector: 'WithStatement',
            message:
              '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
          },
        ],
      },
    };
  }),
};
