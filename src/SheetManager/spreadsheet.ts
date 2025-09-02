import { DriveManager } from "../DriveManager";
import { SheetCache } from "./cache";

export class Spreadsheet {
  private constructor() {}
  private static spreadsheetInstances: Map<
    string,
    GoogleAppsScript.Spreadsheet.Spreadsheet
  >;
  static init() {
    if (!this.spreadsheetInstances) {
      this.spreadsheetInstances = new Map();
    }
  }
  static getSpreadsheet(
    spreadsheetId: string
  ): GoogleAppsScript.Spreadsheet.Spreadsheet | null {
    this.init();
    if (this.spreadsheetInstances.has(spreadsheetId)) {
      return this.spreadsheetInstances.get(spreadsheetId)!;
    }

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    this.spreadsheetInstances.set(spreadsheetId, spreadsheet);
    return spreadsheet;
  }

  static createSpreadsheet(name: string, folderName?: string) {
    const cache = SheetCache.getCache();
    if (cache.spreadsheets[name]) return;
    const spreadsheet = SpreadsheetApp.create(name);
    if (folderName) {
      let folder = DriveManager.Folder.findFolder(
        folderName,
        true
      ) as GoogleAppsScript.Drive.Folder;
      const file = DriveApp.getFileById(spreadsheet.getId());
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    }
    this.saveSpreadsheetID(name, spreadsheet.getId());
    SheetCache.saveCache();
  }

  static deleteSpreadsheet(name: string) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheets[name];
    if (!spreadsheetId) return;
    DriveApp.getFileById(spreadsheetId).setTrashed(true);
    delete cache.spreadsheets[name];
    SheetCache.saveCache();
  }

  static renameSpreadsheet(name: string, newName: string) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheets[name];
    if (!spreadsheetId) return;
    const spreadsheet = this.getSpreadsheet(spreadsheetId);
    if (!spreadsheet) return;
    spreadsheet.rename(newName);
    cache.spreadsheets[newName] = spreadsheetId;
    delete cache.spreadsheets[name];
    SheetCache.saveCache();
  }

  static existsSpreadsheet(name: string) {
    const cache = SheetCache.getCache();
    return !!cache.spreadsheets[name];
  }
  static getSpreadsheetData(name: string) {
    const cache = SheetCache.getCache();

    const spreadsheetId = cache.spreadsheets[name];
    if (!spreadsheetId) return;
    return this.getSpreadsheet(spreadsheetId);
  }

  static saveSpreadsheetID(name: string, id: string) {
    const cache = SheetCache.getCache();
    cache.spreadsheets[name] = id;
    SheetCache.saveCache();
  }
  static registerSpreadsheet(name: string) {
    const cache = SheetCache.getCache();
    if (cache.spreadsheets[name]) {
      return cache.spreadsheets[name];
    }
    const files = DriveApp.searchFiles(
      `title = '${name}' and mimeType = 'application/vnd.google-apps.spreadsheet'`
    );
    if (files.hasNext()) {
      const file = files.next();
      const id = file.getId();
      this.saveSpreadsheetID(name, id);
      SheetCache.saveCache();
      return id;
    }
    return null;
  }
  static hasSpreadsheetChanged(spreadsheetName: string): boolean {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheets[spreadsheetName];
    if (!spreadsheetId)
      throw new Error(`Spreadsheet "${spreadsheetName}" does not exist.`);
    const file = DriveApp.getFileById(spreadsheetId);
    const lastUpdatedMs = file.getLastUpdated().getTime();
    const prev = cache.spreadsheetLastUpdates[spreadsheetId] || 0;
    cache.spreadsheetLastUpdates[spreadsheetId] = lastUpdatedMs;
    SheetCache.saveCache();
    return prev != lastUpdatedMs;
  }
}
