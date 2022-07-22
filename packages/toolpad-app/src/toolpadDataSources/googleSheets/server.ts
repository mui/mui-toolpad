import { NextApiRequest, NextApiResponse } from 'next';
import { drive_v3 } from '@googleapis/drive';
import { sheets_v4 } from '@googleapis/sheets';
import { OAuth2Client } from 'google-auth-library';
import { match } from 'path-to-regexp';
import { ApiResult, ServerDataSource, CreateHandlerApi } from '../../types';
import config from '../../server/config';
import { asArray } from '../../utils/collections';
import {
  GoogleSheetsConnectionParams,
  GoogleSheetsPrivateQueryType,
  GoogleSheetsPrivateQuery,
  GoogleSheetsApiQuery,
} from './types';
import { Maybe } from '../../utils/types';

/**
 * Create an OAuth2 client based on the configuration
 */

function createOAuthClient(): OAuth2Client {
  if (!config.googleSheetsClientId) {
    throw new Error('Google Sheets: Missing client ID "TOOLPAD_DATASOURCE_GOOGLESHEETS_CLIENT_ID"');
  }
  if (!config.googleSheetsClientSecret) {
    throw new Error(
      'Google Sheets: Missing client secret "TOOLPAD_DATASOURCE_GOOGLESHEETS_CLIENT_SECRET"',
    );
  }
  if (!config.externalUrl) {
    throw new Error('Google Sheets: Missing redirect URL "TOOLPAD_EXTERNAL_URL"');
  }
  return new OAuth2Client(
    config.googleSheetsClientId,
    config.googleSheetsClientSecret,
    new URL('/api/dataSources/googleSheets/auth/callback', config.externalUrl).href,
  );
}

/**
 * Create a Google Drive client based on the configuration
 */

function createDriveClient(client: OAuth2Client) {
  if (!client) {
    throw new Error('Malformed Google Sheets datasource client');
  }
  return new drive_v3.Drive({
    auth: client,
  });
}

/**
 * Create a Google Sheets client based on the configuration
 */

function createSheetsClient(client: OAuth2Client) {
  if (!client) {
    throw new Error('Malformed Google Sheets datasource client');
  }
  return new sheets_v4.Sheets({
    auth: client,
  });
}

/**
 * Private executor function for this connection
 * @param connection  The connection object
 * @param query  The query object
 * @returns The private api response
 */

async function execPrivate(
  connection: Maybe<GoogleSheetsConnectionParams>,
  query: GoogleSheetsPrivateQuery,
): Promise<any> {
  const client = createOAuthClient();
  if (connection) {
    client.setCredentials(connection);
  }
  if (query.type === GoogleSheetsPrivateQueryType.FILE_GET) {
    const driveClient = createDriveClient(client);
    const { spreadsheetId } = query;
    if (spreadsheetId) {
      const response = await driveClient.files.get({
        fileId: spreadsheetId,
      });
      if (response.status === 200) {
        return response.data;
      }
      throw new Error(
        `${response?.status}: ${response.statusText} Failed to fetch "${JSON.stringify(query)}"`,
      );
    }
    throw new Error(`Google Sheets: Missing spreadsheetId in query`);
  }
  if (query.type === GoogleSheetsPrivateQueryType.FILES_LIST) {
    const driveClient = createDriveClient(client);
    const { spreadsheetQuery, pageToken } = query;
    let queryString = "mimeType='application/vnd.google-apps.spreadsheet'";
    if (spreadsheetQuery) {
      /** Escaping spreadsheetQuery
       *  based on: https://developers.google.com/drive/api/guides/ref-search-terms#file_properties
       */
      const escapedSpreadsheetQuery = spreadsheetQuery.replace(/\\|'/g, '\\$&');
      queryString = `name contains '${escapedSpreadsheetQuery}' and ${queryString}`;
    }

    const response = await driveClient.files.list({
      q: queryString,
      pageToken,
    });

    if (response.status === 200) {
      return response.data;
    }
    throw new Error(
      `${response?.status}: ${response.statusText} Failed to fetch "${JSON.stringify(query)}"`,
    );
  }
  if (query.type === GoogleSheetsPrivateQueryType.FETCH_SPREADSHEET) {
    const sheetsClient = createSheetsClient(client);
    const { spreadsheetId } = query;
    if (spreadsheetId) {
      const response = await sheetsClient.spreadsheets.get({
        spreadsheetId,
        includeGridData: false,
      });
      if (response.status === 200) {
        return response.data;
      }
      throw new Error(
        `${response?.status}: ${response.statusText} Failed to fetch "${JSON.stringify(query)}"`,
      );
    }
    throw new Error(`Google Sheets: Missing spreadsheetId in query`);
  }
  if (query.type === GoogleSheetsPrivateQueryType.CONNECTION_STATUS) {
    const driveClient = createDriveClient(client);
    const response = await driveClient.about.get({ fields: 'user' });
    if (response.status === 200) {
      return response.data.user;
    }
    return null;
  }
  throw new Error(`Google Sheets: Unrecognized private query "${JSON.stringify(query)}"`);
}

/**
 * Executor function for this connection
 * @param connection  The connection object
 * @param query  The query object
 * @returns The api response
 */

async function exec(
  connection: Maybe<GoogleSheetsConnectionParams>,
  query: GoogleSheetsApiQuery,
): Promise<ApiResult<any>> {
  const client = createOAuthClient();
  if (connection) {
    client.setCredentials(connection);
  }
  const sheets = createSheetsClient(client);

  const { spreadsheetId, sheetName, ranges, headerRow } = query;
  if (spreadsheetId && sheetName) {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!${ranges}`,
    });
    if (response.status === 200) {
      const { values } = response.data;
      if (values && values.length > 0) {
        let data = values;
        if (headerRow) {
          const firstRow = values.shift() ?? [];
          data = values.map((row) => {
            const rowObject: any = {};
            row.forEach((elem, cellIndex) => {
              if (firstRow[cellIndex]) {
                rowObject[firstRow[cellIndex]] = elem;
              }
            });
            return rowObject;
          });
        }
        return { data };
      }
      return { data: [] };
    }
    throw new Error(
      `${response.status}: ${response.statusText} Failed to fetch "${JSON.stringify(query)}"`,
    );
  }
  return {
    data: {},
  };
}

/**
 * Handler for new connections
 * @param api  The api for the handler object
 * @param req  The request object
 * @param res The response object
 */

async function handler(
  api: CreateHandlerApi<GoogleSheetsConnectionParams>,
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<NextApiResponse | void> {
  const client = createOAuthClient();
  try {
    const pathname = `/${asArray(req.query.path)
      .map((segment = '') => encodeURIComponent(segment))
      .join('/')}`;
    const matchAuthLogin = match('/auth/login', { decode: decodeURIComponent });
    const matchAuthCallback = match('/auth/callback', { decode: decodeURIComponent });

    const [state] = asArray(req.query.state);
    if (!state) {
      return res.status(400).send(`Missing query parameter "state"`);
    }
    const { connectionId, appId } = JSON.parse(decodeURIComponent(state));

    // Check if connection with connectionId exists, if so: merge
    const savedConnection = await api.getConnectionParams(appId, connectionId);
    if (savedConnection) {
      client.setCredentials(savedConnection);
    }
    if (matchAuthLogin(pathname)) {
      return res.redirect(
        client.generateAuthUrl({
          access_type: 'offline',
          scope: [
            'https://www.googleapis.com/auth/spreadsheets.readonly',
            'https://www.googleapis.com/auth/drive.readonly',
          ],
          state,
          include_granted_scopes: true,
          prompt: 'consent',
        }),
      );
    }
    if (matchAuthCallback(pathname)) {
      const [oAuthError] = asArray(req.query.error);
      if (oAuthError) {
        throw new Error(oAuthError);
      }
      const [code] = asArray(req.query.code);
      if (!code) {
        return res.status(400).send(`Missing query parameter "code"`);
      }
      const { tokens, res: getTokenResponse } = await client.getToken(code);
      if (!tokens) {
        throw new Error(`${getTokenResponse?.status}: ${getTokenResponse?.statusText}`);
      }
      if (tokens) {
        client.setCredentials(tokens);
        await api.setConnectionParams(appId, connectionId, client.credentials);
      }
      return res.redirect(
        `/_toolpad/app/${encodeURIComponent(appId)}/editor/connections/${encodeURIComponent(
          connectionId,
        )}`,
      );
    }
    return res.status(404).send('No handler exists for given path');
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
      return res.status(500).send(e.message);
    }
    return res.status(500).send(e);
  }
}

const dataSource: ServerDataSource<
  GoogleSheetsConnectionParams,
  GoogleSheetsApiQuery,
  GoogleSheetsPrivateQuery
> = {
  exec,
  execPrivate,
  createHandler: () => handler,
};

export default dataSource;
