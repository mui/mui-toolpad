import { PackageJson } from './templates/packageType';

export type SupportedAuthProvider = 'Credentials' | 'Google' | 'GitHub' | 'Facebook';
export type SupportedRouter = 'nextjs-app' | 'nextjs-pages';
export type PackageManager = 'npm' | 'pnpm' | 'yarn';

declare global {
  interface TemplateFile {
    content: string;
  }
}

export type Template = (provider: SupportedAuthProvider) => TemplateFile;
export type PackageJsonTemplate = (appName: string) => PackageJson;
