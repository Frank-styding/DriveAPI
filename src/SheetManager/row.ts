import { SheetCache } from "./cache";
import { FormulaProcessor } from "./formula";

export class Row {
  private constructor() {}
  static insertRow(
    spreadsheetName: string,
    sheetName: string,
    rowData: Record<string, any>
  ) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet does not exist.");
    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    const rowValues = headers.map((header) => rowData[header] || "");
    sheet.appendRow(rowValues);
    SheetCache.saveCache();
  }
  static insertRows(
    spreadsheetName: string,
    sheetName: string,
    rowsData: Record<string, any>[]
  ) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet does not exist.");
    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    const rowsValues = rowsData.map((rowData) =>
      headers.map((header) => rowData[header] || "")
    );
    sheet
      .getRange(sheet.getLastRow() + 1, 1, rowsValues.length, headers.length)
      .setValues(rowsValues);
    SheetCache.saveCache();
  }
  static deleteRow(spreadsheetName: string, sheetName: string, id: number) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet does not exist.");
    const lastRow = sheet.getLastRow();
    if (id < 1 || id > lastRow) {
      throw new Error(`Row with ID ${id} does not exist.`);
    }
    sheet.deleteRow(id);
    SheetCache.saveCache();
  }
  static updateRow(
    spreadsheetName: string,
    sheetName: string,
    id: number,
    rowData: Record<string, any>
  ) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet does not exist.");
    const lastRow = sheet.getLastRow();
    if (id < 1 || id > lastRow) {
      throw new Error(`Row with ID ${id} does not exist.`);
    }
    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    const pevRowData = sheet.getRange(id, 1, 1, headers.length).getValues()[0];
    const rowValues = headers.map(
      (header) => rowData[header] || pevRowData[headers.indexOf(header)] || ""
    );
    sheet.getRange(id + 1, 1, 1, rowValues.length).setValues([rowValues]);
    SheetCache.saveCache();
  }
  static getRow(
    spreadsheetName: string,
    sheetName: string,
    id: number
  ): Record<string, any> {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet does not exist.");
    const lastRow = sheet.getLastRow();
    if (id < 1 || id > lastRow) {
      throw new Error(`Row with ID ${id} does not exist.`);
    }
    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    const rowValues = sheet
      .getRange(id + 1, 1, 1, headers.length)
      .getValues()[0];
    const rowData: Record<string, any> = {};
    headers.forEach((header, index) => {
      rowData[header] = rowValues[index];
    });
    return rowData;
  }
  static findRow(
    spreadsheetName: string,
    sheetName: string,
    searchedCriteriaObject: Record<string, any>
  ): Record<string, any> {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet does not exist.");
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return {}; // No data to search
    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    const dataRange = sheet.getRange(2, 1, lastRow - 1, headers.length);
    const dataValues = dataRange.getValues();
    for (let i = 0; i < dataValues.length; i++) {
      const rowData: Record<string, any> = {};
      headers.forEach((header, index) => {
        rowData[header] = dataValues[i][index];
      });
      let match = true;
      for (const key in searchedCriteriaObject) {
        if (rowData[key] !== searchedCriteriaObject[key]) {
          match = false;
          break;
        }
      }
      if (match) return rowData;
    }
    return {};
  }
  static getMaxRow(spreadsheetName: string, sheetName: string, col: number) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId)
      throw new Error(`Spreadsheet "${spreadsheetName}" does not exist.`);
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet "${sheetName}" does not exist.`);
    return sheet
      .getRange(sheet.getMaxRows(), col)
      .getNextDataCell(SpreadsheetApp.Direction.UP)
      .getRow();
  }
  static insertRowsRange(
    spreadsheetName: string,
    sheetName: string,
    startCol: number,
    rows: string[][]
  ) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId)
      throw new Error(`Spreadsheet "${spreadsheetName}" does not exist.`);

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet "${sheetName}" does not exist.`);

    if (!rows || rows.length === 0) {
      throw new Error("No rows provided to insert.");
    }

    const values: string[][] = [];
    var lastRow = sheet
      .getRange(sheet.getMaxRows(), startCol)
      .getNextDataCell(SpreadsheetApp.Direction.UP)
      .getRow();

    const startRow = lastRow + 1;

    rows.forEach((row, rowIndex) => {
      const rowValues: string[] = [];
      row.forEach((item) => {
        if (item && item.startsWith("formula:")) {
          const formula = FormulaProcessor.processFormula(
            startCol,
            startRow + rowIndex,
            item.slice(8)
          );
          rowValues.push(formula);
        } else {
          rowValues.push(item || "");
        }
      });
      values.push(rowValues);
    });

    sheet
      .getRange(startRow, startCol, values.length, values[0].length)
      .setValues(values);
  }
}
