import { PackageJson } from './templates/packageType';

// https://authjs.dev/reference/core/providers#oauthconfigprofile
type SupportedOAuthProvider = 'facebook' | 'github' | 'google';

// https://authjs.dev/reference/core/providers#providertype
export type SupportedAuthProvider = SupportedOAuthProvider | 'credentials';

export type SupportedRouter = 'nextjs-app' | 'nextjs-pages';
export type PackageManager = 'npm' | 'pnpm' | 'yarn';
type ProjectType = 'core' | 'studio';

export type ProviderTemplate = (provider: SupportedAuthProvider) => string;

export type ProvidersTemplate = (providers: SupportedAuthProvider[]) => string;

export type BooleanTemplate = (value: boolean) => string;

export type PackageJsonTemplate = (
  appName: string,
  projectType: ProjectType,
  routerType?: SupportedRouter,
  authOption?: boolean,
  coreVersion?: string,
) => PackageJson;
