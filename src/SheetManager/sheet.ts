import { SheetCache } from "./cache";

export class Sheet {
  private constructor() {}
  static createSheet(spreadsheetName: string, name: string) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.insertSheet(name);
    const defaultSheet = spreadsheet.getSheetByName("Hoja 1");
    if (defaultSheet) {
      spreadsheet.deleteSheet(defaultSheet);
    }
    if (!sheet) throw new Error("Sheet could not be created.");
    SheetCache.saveCache();
  }
  static deleteSheet(spreadsheetName: string, name: string) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(name);
    if (!sheet) throw new Error("Sheet does not exist.");
    spreadsheet.deleteSheet(sheet);
    SheetCache.saveCache();
  }
  static renameSheet(spreadsheetName: string, name: string, newName: string) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(name);
    if (!sheet) throw new Error("Sheet does not exist.");
    sheet.setName(newName);
    SheetCache.saveCache();
  }
  static existsSheet(spreadsheetName: string, name: string) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) return false;
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    return !!spreadsheet.getSheetByName(name);
  }
  static getSheetData(spreadsheetName: string, name: string) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) return;
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(name);
    if (!sheet) return;
    return sheet.getDataRange().getValues();
  }
  static getSheetNames(spreadsheetName: string) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) return [];
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    return spreadsheet.getSheets().map((sheet) => sheet.getName());
  }
}
