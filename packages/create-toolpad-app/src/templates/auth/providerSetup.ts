const providerSetup: TemplateFile = {
  content: `
import type { Provider } from 'next-auth/providers';

const providers: Provider[] = [`,
};

export default providerSetup;
