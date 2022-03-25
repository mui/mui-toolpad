import sharedConfig, { SharedConfig } from '../config';

export interface ServerConfig extends SharedConfig {
  databaseUrl: string;
  googleSheetsClientId?: string;
  googleSheetsClientSecret?: string;
  studioExternalUrl?: string;
  encryptionKeys: string[];
}

function readConfig(): ServerConfig {
  // TODO: Find/evaluate libraries:
  //  - https://www.npmjs.com/package/convict
  //  - https://www.npmjs.com/package/env-schema
  //  - https://www.npmjs.com/package/config
  //  - https://www.npmjs.com/package/ajv
  //  - ...?
  // Features:
  //  - read from env
  //  - optional: read from args
  //  - optional: read from file
  //  - strongly typed output
  //  - validate all at once, print summary of errors
  //  - print help text (e.g. on --help)
  //  - config object to generate docs from
  //  - optional: custom formats/validators
  //  - ...?

  if (!process.env.STUDIO_DATABASE_URL) {
    throw new Error(`App started without config env variable STUDIO_DATABASE_URL`);
  }

  const encryptionKeys: string[] =
    process.env.STUDIO_ENCRYPTION_KEYS?.split(/\s+/).filter(Boolean) ?? [];

  return {
    ...sharedConfig,
    databaseUrl: process.env.STUDIO_DATABASE_URL,
    googleSheetsClientId: process.env.STUDIO_DATASOURCE_GOOGLESHEETS_CLIENT_ID,
    googleSheetsClientSecret: process.env.STUDIO_DATASOURCE_GOOGLESHEETS_CLIENT_SECRET,
    studioExternalUrl: process.env.STUDIO_EXTERNAL_URL,
    // Whitespace separated, do not use spaces in your keys
    encryptionKeys,
  };
}

export default readConfig();
