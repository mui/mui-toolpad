import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  projects: ['<rootDir>/packages/toolpad-app/jest.config.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/utils/jest-setup.ts'],
};

export default config;
