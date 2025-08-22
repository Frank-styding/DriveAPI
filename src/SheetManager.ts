import { DriveManager } from "./DriveManger";

interface SheetCache {
  spreadsheetsData: Record<string, string>;
  lastUpdated: number;
}
/**
 * SheetManager provides static methods to manage Google Sheets, including spreadsheets, sheets, and table data.
 * It allows creation, deletion, renaming, and data manipulation for spreadsheets and sheets.
 */
export class SheetManager {
  private constructor() {}

  //? spreadsheet methods
  //#region Spreadsheet Methods
  /**
   * Returns the names of all spreadsheets in the cache.
   * @returns Array of spreadsheet names
   */
  static getSpreadsheetNames() {
    this.getCache();
    return Object.keys(this.cache.spreadsheetsData);
  }
  /**
   * Creates a new spreadsheet and optionally places it in a folder.
   * @param name Spreadsheet name
   * @param folderName (Optional) Folder name
   */
  static createSpreadsheet(name: string, folderName?: string) {
    this.getCache();
    if (this.cache.spreadsheetsData[name]) return;
    const spreadsheet = SpreadsheetApp.create(name);
    if (folderName) {
      let folderId = DriveManager.getFolderID(folderName);
      if (!folderId) {
        folderId = DriveManager.createFolder(folderName)?.getId() as string;
      }
      if (!folderId) throw new Error(`Folder ${folderName} does not exist.`);
      const folder = DriveApp.getFolderById(folderId);
      const file = DriveApp.getFileById(spreadsheet.getId());
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    }
    this.saveSpreadsheetID(name, spreadsheet.getId());
    this.saveCache();
  }
  /**
   * Deletes a spreadsheet and removes it from the cache.
   * @param name Spreadsheet name
   */
  static deleteSpreadsheet(name: string) {
    this.getCache();
    const spreadsheetId = this.cache.spreadsheetsData[name];
    if (!spreadsheetId) return;
    DriveApp.getFileById(spreadsheetId).setTrashed(true);
    delete this.cache.spreadsheetsData[name];
    this.saveCache();
  }
  /**
   * Renames a spreadsheet and updates the cache.
   * @param name Current spreadsheet name
   * @param newName New spreadsheet name
   */
  static renameSpreadsheet(name: string, newName: string) {
    this.getCache();
    const spreadsheetId = this.cache.spreadsheetsData[name];
    if (!spreadsheetId) return;
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    spreadsheet.rename(newName);
    this.cache.spreadsheetsData[newName] = spreadsheetId;
    delete this.cache.spreadsheetsData[name];
    this.saveCache();
  }
  /**
   * Checks if a spreadsheet exists in the cache.
   * @param name Spreadsheet name
   * @returns True if exists, false otherwise
   */
  static existsSpreadsheet(name: string) {
    this.getCache();
    return !!this.cache.spreadsheetsData[name];
  }
  /**
   * Gets the SpreadsheetApp object for a spreadsheet.
   * @param name Spreadsheet name
   * @returns SpreadsheetApp object or undefined
   */
  static getSpreadsheetData(name: string) {
    this.getCache();
    const spreadsheetId = this.cache.spreadsheetsData[name];
    if (!spreadsheetId) return;
    return SpreadsheetApp.openById(spreadsheetId);
  }
  //#endregion

  //? sheet methods
  //#region Sheet Methods
  /**
   * Creates a new sheet in a spreadsheet.
   * @param spreadsheetName Spreadsheet name
   * @param name Sheet name
   */
  static createSheet(spreadsheetName: string, name: string) {
    this.getCache();
    const spreadsheetId = this.cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.insertSheet(name);
    const defaultSheet = spreadsheet.getSheetByName("Hoja 1");
    if (defaultSheet) {
      spreadsheet.deleteSheet(defaultSheet);
    }
    if (!sheet) throw new Error("Sheet could not be created.");
    this.saveCache();
  }
  /**
   * Deletes a sheet from a spreadsheet.
   * @param spreadsheetName Spreadsheet name
   * @param name Sheet name
   */
  static deleteSheet(spreadsheetName: string, name: string) {
    this.getCache();
    const spreadsheetId = this.cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(name);
    if (!sheet) throw new Error("Sheet does not exist.");
    spreadsheet.deleteSheet(sheet);
    this.saveCache();
  }
  /**
   * Renames a sheet in a spreadsheet.
   * @param spreadsheetName Spreadsheet name
   * @param name Current sheet name
   * @param newName New sheet name
   */
  static renameSheet(spreadsheetName: string, name: string, newName: string) {
    this.getCache();
    const spreadsheetId = this.cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(name);
    if (!sheet) throw new Error("Sheet does not exist.");
    sheet.setName(newName);
    this.saveCache();
  }
  /**
   * Checks if a sheet exists in a spreadsheet.
   * @param spreadsheetName Spreadsheet name
   * @param name Sheet name
   * @returns True if exists, false otherwise
   */
  static existsSheet(spreadsheetName: string, name: string) {
    this.getCache();
    const spreadsheetId = this.cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) return false;
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    return !!spreadsheet.getSheetByName(name);
  }
  /**
   * Gets all data from a sheet as a 2D array.
   * @param spreadsheetName Spreadsheet name
   * @param name Sheet name
   * @returns 2D array of sheet data or undefined
   */
  static getSheetData(spreadsheetName: string, name: string) {
    this.getCache();
    const spreadsheetId = this.cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) return;
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(name);
    if (!sheet) return;
    return sheet.getDataRange().getValues();
  }
  /**
   * Returns the names of all sheets in a spreadsheet.
   * @param spreadsheetName Spreadsheet name
   * @returns Array of sheet names
   */
  static getSheetNames(spreadsheetName: string) {
    this.getCache();
    const spreadsheetId = this.cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) return [];
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    return spreadsheet.getSheets().map((sheet) => sheet.getName());
  }
  /**
   * Creates a table (header row) in a sheet and sets column widths.
   * @param spreadsheetName Spreadsheet name
   * @param sheetName Sheet name
   * @param columns Array of column names
   */
  static createtTable(
    spreadsheetName: string,
    sheetName: string,
    columns: string[]
  ) {
    this.getCache();
    const spreadsheetId = this.cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet does not exist.");
    if (sheet.getLastRow() > 0) {
      throw new Error("Sheet already has data. Cannot create table.");
    }

    // Set the first row as the header
    sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
    // Set the header style
    const headerRange = sheet.getRange(1, 1, 1, columns.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f0f0f0");
    headerRange.setHorizontalAlignment("center");
    // Set the column widths
    columns.forEach((column, index) => {
      const columnWidth = Math.max(column.length * 10, 100); // Minimum width of 100px
      sheet.setColumnWidth(index + 1, columnWidth);
    });
    // Delete extra columns if any
    const maxCols = sheet.getMaxColumns();
    if (maxCols > columns.length) {
      sheet.deleteColumns(columns.length + 1, maxCols - columns.length);
    }

    // Save the cache after creating the table
    this.saveCache();
  }
  // #endregion

  //? row methods
  //#region row Methods
  /**
   * Inserts a row of data into a sheet.
   * @param spreadsheetName Spreadsheet name
   * @param sheetName Sheet name
   * @param rowData Row data as an object
   */
  static insertRow(
    spreadsheetName: string,
    sheetName: string,
    rowData: Record<string, any>
  ) {
    this.getCache();
    const spreadsheetId = this.cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet does not exist.");
    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    const rowValues = headers.map((header) => rowData[header] || "");
    sheet.appendRow(rowValues);
    this.saveCache();
  }
  /**
   * Deletes a row from a sheet by its index.
   * @param spreadsheetName Spreadsheet name
   * @param sheetName Sheet name
   * @param id Row index (1-based)
   */
  static deleteRow(spreadsheetName: string, sheetName: string, id: number) {
    this.getCache();
    const spreadsheetId = this.cache.spreadsheetsData[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet does not exist.");
    const lastRow = sheet.getLastRow();
    if (id < 1 || id > lastRow) {
      throw new Error(`Row with ID ${id} does not exist.`);
    }
    sheet.deleteRow(id);
    this.saveCache();
  }

  /**
   * Updates a row in a sheet by its index.
   * @param spreadsheetName Spreadsheet name
   * @param sheetName Sheet name
   * @param id Row index (1-based)
   * @param rowData New row data as an object
   */
  static updateRow(
    spreadsheetName: string,
    sheetName: string,
    id: number,
    rowData: Record<string, any>
  ) {
    this.getCache();
    const spreadsheetId = this.cache.spreadsheetsData[spreadsheetName];
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
    this.saveCache();
  }

  /**
   * Gets a row from a sheet by its index as an object.
   * @param spreadsheetName Spreadsheet name
   * @param sheetName Sheet name
   * @param id Row index (1-based)
   * @returns Row data as an object
   */
  static getRow(
    spreadsheetName: string,
    sheetName: string,
    id: number
  ): Record<string, any> {
    this.getCache();
    const spreadsheetId = this.cache.spreadsheetsData[spreadsheetName];
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

  /**
   * Finds a row in a sheet matching the given criteria.
   * @param spreadsheetName Spreadsheet name
   * @param sheetName Sheet name
   * @param searchedCriteriaObject Criteria as an object
   * @returns Row data as an object or empty object if not found
   */
  static findRow(
    spreadsheetName: string,
    sheetName: string,
    searchedCriteriaObject: Record<string, any>
  ): Record<string, any> {
    this.getCache();
    const spreadsheetId = this.cache.spreadsheetsData[spreadsheetName];
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
    // No matching row found
    return {};
  }

  /**
   * Inserts multiple rows of data into a sheet.
   * @param spreadsheetName Spreadsheet name
   * @param sheetName Sheet name
   * @param rowsData Array of row data objects
   */
  static insertRows(
    spreadsheetName: string,
    sheetName: string,
    rowsData: Record<string, any>[]
  ) {
    this.getCache();
    const spreadsheetId = this.cache.spreadsheetsData[spreadsheetName];
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
    this.saveCache();
  }
  //#endregion

  //? cache methods
  //#region Cache Methods
  private static cache: SheetCache;
  private static initialize() {
    if (this.cache != undefined) return;
    this.cache = {
      spreadsheetsData: {},
      lastUpdated: 0,
    };
  }
  private static getCache() {
    this.initialize();
    const cache =
      PropertiesService.getScriptProperties().getProperty("sheetCache");
    if (cache) this.cache = JSON.parse(cache);
  }
  /**
   * Gets the spreadsheet ID from the cache by name.
   * @param name Spreadsheet name
   * @returns Spreadsheet ID
   */
  static getSpreadsheetCache(name: string) {
    this.getCache();
    return this.cache.spreadsheetsData[name];
  }
  /**
   * Saves the current sheet cache to PropertiesService.
   */
  static saveCache() {
    PropertiesService.getScriptProperties().setProperty(
      "sheetCache",
      JSON.stringify(this.cache)
    );
  }
  private static saveSpreadsheetID(name: string, id: string) {
    this.cache.spreadsheetsData[name] = id;
  }
  private static getSpreadsheetID(name: string) {
    return this.cache.spreadsheetsData[name];
  }
  /**
   * Clears the sheet cache and removes it from PropertiesService.
   */
  static clearCache() {
    this.cache = {
      spreadsheetsData: {},
      lastUpdated: 0,
    };
    PropertiesService.getScriptProperties().deleteProperty("sheetCache");
  }

  //#endregion
}
