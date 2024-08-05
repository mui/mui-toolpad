import { Template } from '../../types';

const providerImport: Template = (provider) => ({
  content: `
  import ${provider} from 'next-auth/providers/${provider?.toLowerCase()}';`,
});

export default providerImport;
