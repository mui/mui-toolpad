import { drive_v3, sheets_v4 } from 'googleapis';

export type GoogleSheetsConnectionParams = {
  refresh_token?: string | null;
  expiry_date?: number | null;
  access_token?: string | null;
  token_type?: string | null;
  id_token?: string | null;
};

export type GoogleDriveFile = drive_v3.Schema$File;

export type GoogleSpreadsheet = sheets_v4.Schema$Spreadsheet;

export type GoogleSheet = sheets_v4.Schema$Sheet;

type GoogleSheetProperties = sheets_v4.Schema$SheetProperties;

export type GoogleDriveFiles = drive_v3.Schema$FileList;

export type GoogleDriveUser = drive_v3.Schema$User;

export type GoogleSheetsApiQuery = {
  /**
   * The ranges to retrieve from the spreadsheet.
   */
  ranges: string;
  /**
   * The spreadsheet to request.
   */
  spreadsheetId: GoogleDriveFile['id'];
  /**
   * The sheet to request.
   */
  sheetName: GoogleSheetProperties['title'];
  /**
   * Whether to transform the response assuming
   * the first row to be column headers
   */
  headerRow: boolean;
};

export enum GoogleSheetsPrivateQueryType {
  FILE_GET = 'FILE_GET',
  FILES_LIST = 'FILES_LIST',
  FETCH_SPREADSHEET = 'FETCH_SPREADSHEET',
  CONNECTION_STATUS = 'CONNECTION_STATUS',
}

export type GoogleSheetsPrivateQuery =
  | {
      type: GoogleSheetsPrivateQueryType.FILE_GET;
      spreadsheetId: GoogleSheetsApiQuery['spreadsheetId'];
    }
  | {
      type: GoogleSheetsPrivateQueryType.FILES_LIST;
      spreadsheetQuery?: string | null;
      pageToken?: string;
    }
  | {
      type: GoogleSheetsPrivateQueryType.FETCH_SPREADSHEET;
      spreadsheetId: GoogleSheetsApiQuery['spreadsheetId'];
    }
  | {
      type: GoogleSheetsPrivateQueryType.CONNECTION_STATUS;
    };
