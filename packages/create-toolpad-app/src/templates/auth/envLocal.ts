import { kebabToConstant } from '@toolpad/utils/strings';
import { requiresIssuer, requiresTenantId } from './utils';
import { Template } from '../../types';

const env: Template = (options) => {
  const { authProviders: providers } = options;
  const nonCredentialProviders = providers?.filter((provider) => provider !== 'credentials');
  return `
# Generate a secret with \`npx auth secret\`
# and replace the value below with it
AUTH_SECRET=secret

# Add secrets for your auth providers to the .env.local file

${nonCredentialProviders
  ?.map(
    (provider) => `
${kebabToConstant(provider)}_CLIENT_ID=
${kebabToConstant(provider)}_CLIENT_SECRET=
${requiresIssuer(provider) ? `${kebabToConstant(provider)}_ISSUER=\n` : ''}${requiresTenantId(provider) ? `${kebabToConstant(provider)}_TENANT_ID=\n` : ''}`,
  )
  .join('\n')}    
`;
};

export default env;
