import { SheetCache } from "./cache";
import { Spreadsheet } from "./spreadsheet";

export class Sheet {
  private constructor() {}
  static createSheet(spreadsheetName: string, name: string) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheets[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = Spreadsheet.getSpreadsheet(spreadsheetId);
    if (!spreadsheet) return;
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
    const spreadsheetId = cache.spreadsheets[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = Spreadsheet.getSpreadsheet(spreadsheetId);
    if (!spreadsheet) return;

    const sheet = spreadsheet.getSheetByName(name);
    if (!sheet) throw new Error("Sheet does not exist.");
    spreadsheet.deleteSheet(sheet);
    SheetCache.saveCache();
  }
  static renameSheet(spreadsheetName: string, name: string, newName: string) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheets[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = Spreadsheet.getSpreadsheet(spreadsheetId);
    if (!spreadsheet) return;

    const sheet = spreadsheet.getSheetByName(name);
    if (!sheet) throw new Error("Sheet does not exist.");
    sheet.setName(newName);
    SheetCache.saveCache();
  }
  static existsSheet(spreadsheetName: string, name: string) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheets[spreadsheetName];
    if (!spreadsheetId) return false;
    const spreadsheet = Spreadsheet.getSpreadsheet(spreadsheetId);
    if (!spreadsheet) return false;
    return !!spreadsheet.getSheetByName(name);
  }
  static getSheetData(spreadsheetName: string, name: string) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheets[spreadsheetName];
    if (!spreadsheetId) return;
    const spreadsheet = Spreadsheet.getSpreadsheet(spreadsheetId);
    if (!spreadsheet) return;

    const sheet = spreadsheet.getSheetByName(name);
    if (!sheet) return;
    return sheet.getDataRange().getValues();
  }
  static getSheets(spreadsheetName: string) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheets[spreadsheetName];
    if (!spreadsheetId) return [];
    const spreadsheet = Spreadsheet.getSpreadsheet(spreadsheetId);
    if (!spreadsheet) return [];
    return spreadsheet.getSheets();
  }
}
