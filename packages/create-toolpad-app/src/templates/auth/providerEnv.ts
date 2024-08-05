import { Template } from '../../types';

const providerEnv: Template = (provider) => ({
  content: `
${provider?.toUpperCase()}_CLIENT_ID=
${provider?.toUpperCase()}_CLIENT_SECRET=
`,
});

export default providerEnv;
