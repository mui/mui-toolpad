import { Template } from '../../types';

const oaAuthProvider: Template = (provider) => ({
  content: `
  ${provider}({
    clientId: process.env.${provider?.toUpperCase()}_CLIENT_ID,
    clientSecret: process.env.${provider?.toUpperCase()}_CLIENT_SECRET,
  }),`,
});

export default oaAuthProvider;
