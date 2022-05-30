const withTM = require('next-transpile-modules')(['@mui/toolpad-app']);

const base = require('@mui/toolpad-app/next.config.js');

base.env.TOOLPAD_TARGET = 'CLOUD';

module.exports = withTM(base);
