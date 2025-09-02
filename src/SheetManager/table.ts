import { SheetCache } from "./cache";
import { Spreadsheet } from "./spreadsheet";

export class Table {
  private constructor() {}
  static createtTable(
    spreadsheetName: string,
    sheetName: string,
    columns: string[]
  ) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheets[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = Spreadsheet.getSpreadsheet(spreadsheetId);
    if (!spreadsheet) return;
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
    const spreadsheetId = cache.spreadsheets[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = Spreadsheet.getSpreadsheet(spreadsheetId);
    if (!spreadsheet) return;

    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet does not exist.");
    sheet.getRange(1, startCol, 1, headers.length).setFormulas([headers]);
    SheetCache.saveCache();
  }
  static sortTable(
    spreadsheetName: string,
    sheetName: string,
    startCol: number,
    startRow: number,
    columns: number,
    columnIndex: number,
    ascending: boolean
  ) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheets[spreadsheetName];
    if (!spreadsheetId)
      throw new Error(`Spreadsheet "${spreadsheetName}" does not exist.`);

    const spreadsheet = Spreadsheet.getSpreadsheet(spreadsheetId);
    if (!spreadsheet) return;
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet)
      throw new Error(
        `Sheet "${sheetName}" does not exist in spreadsheet "${spreadsheetName}".`
      );

    var lastRow = sheet
      .getRange(sheet.getMaxRows(), startCol)
      .getNextDataCell(SpreadsheetApp.Direction.UP)
      .getRow();
    const numRows = lastRow - startRow + 1;
    const range = sheet.getRange(startRow, startCol, numRows, columns);
    range.sort({ column: columnIndex - 1 + startCol, ascending });
  }
  static getTable(
    spreadsheetName: string,
    sheetName: string
  ): Record<string, any>[] {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheets[spreadsheetName];
    if (!spreadsheetId)
      throw new Error(`Spreadsheet "${spreadsheetName}" does not exist.`);

    const spreadsheet = Spreadsheet.getSpreadsheet(spreadsheetId);

    if (!spreadsheet) return [];

    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet "${sheetName}" does not exist.`);

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) return []; // no hay datos (solo headers o vacío)

    // Leer encabezados
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    // Leer todas las filas de datos
    const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    const dataValues = dataRange.getValues();

    // Mapear filas a objetos {header: valor}
    return dataValues.map((row) => {
      const rowData: Record<string, any> = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index];
      });
      return rowData;
    });
  }

  static findByColumnValue(
    spreadsheetName: string,
    sheetName: string,
    columnName: string,
    value: string | number
  ): Record<string, any> | null {
    // Obtener tabla desde cache
    const table = this.getCachedTable(spreadsheetName, sheetName);
    if (!table.length) return null;

    // Buscar la primera fila que coincida
    const row = table.find((r) => r[columnName] == value);
    return row || null;
  }
  static getCachedTable(
    spreadsheetName: string,
    sheetName: string
  ): Record<string, any>[] {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheets[spreadsheetName];
    if (!spreadsheetId)
      throw new Error(`Spreadsheet "${spreadsheetName}" does not exist.`);

    const spreadsheet = Spreadsheet.getSpreadsheet(spreadsheetId);
    if (!spreadsheet) return [];

    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet "${sheetName}" does not exist.`);

    const hasChanged = Spreadsheet.hasSpreadsheetChanged(spreadsheetName);
    let tableData: Record<string, any>[] = [];
    if (hasChanged || !cache.tableCache[spreadsheetName]?.[sheetName]) {
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      if (lastRow < 2) return []; // no hay datos
      const dataValues = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
      if (!cache.tableCache[spreadsheetName])
        cache.tableCache[spreadsheetName] = {};
      if (!cache.tableCache[spreadsheetName][sheetName])
        cache.tableCache[spreadsheetName][sheetName] = [];
      tableData = dataValues.map((row) => {
        const rowData: Record<string, any> = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index];
        });
        return rowData;
      });
      cache.tableCache[spreadsheetName][sheetName] = tableData;
      SheetCache.saveCache();
    } else {
      tableData = cache.tableCache[spreadsheetName][sheetName];
    }

    /* 
    
    //---------------------------------------------------------------------------
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) return []; // no hay datos

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const dataValues = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    //---------------------------------------------------------------------------

    const tableData = dataValues.map((row) => {
      const rowData: Record<string, any> = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index];
      });
      return rowData;
    });

    return tableData;
    */
    return tableData;
  }
}
