import { SheetCache } from "./cache";

export class Table {
  private constructor() {}
  static createtTable(
    spreadsheetName: string,
    sheetName: string,
    columns: string[]
  ) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet does not exist.");
    if (sheet.getLastRow() > 0) {
      throw new Error("Sheet already has data. Cannot create table.");
    }
    sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
    const headerRange = sheet.getRange(1, 1, 1, columns.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f0f0f0");
    headerRange.setHorizontalAlignment("center");
    const maxCols = sheet.getMaxColumns();
    if (maxCols > columns.length) {
      sheet.deleteColumns(columns.length + 1, maxCols - columns.length);
    }
    SheetCache.saveCache();
  }
  static insertHeaders(
    spreadsheetName: string,
    sheetName: string,
    startCol: number,
    headers: string[]
  ) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet does not exist.");
    sheet.getRange(1, startCol, 1, headers.length).setFormulas([headers]);
    SheetCache.saveCache();
  }
}
