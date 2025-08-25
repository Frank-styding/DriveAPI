import { DriveManager } from "../DriveManager";
import { SheetCache } from "./cache";
import { Sheet } from "./sheet";

export class Spreadsheet {
  private constructor() {}
  static createSpreadsheet(name: string, folderName?: string) {
    const cache = SheetCache.getCache();
    if (cache.spreadsheetsData[name]) return;
    const spreadsheet = SpreadsheetApp.create(name);
    if (folderName) {
      let folderId = DriveManager.Folder.getFolderID(folderName);
      if (!folderId) {
        folderId = DriveManager.Folder.createFolder(
          folderName
        )?.getId() as string;
      }
      if (!folderId) throw new Error(`Folder ${folderName} does not exist.`);
      const folder = DriveApp.getFolderById(folderId);
      const file = DriveApp.getFileById(spreadsheet.getId());
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    }
    this.saveSpreadsheetID(name, spreadsheet.getId());
    SheetCache.saveCache();
  }

  static deleteSpreadsheet(name: string) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[name];
    if (!spreadsheetId) return;
    DriveApp.getFileById(spreadsheetId).setTrashed(true);
    delete cache.spreadsheetsData[name];
    SheetCache.saveCache();
  }

  static renameSpreadsheet(name: string, newName: string) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheetsData[name];
    if (!spreadsheetId) return;
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    spreadsheet.rename(newName);
    cache.spreadsheetsData[newName] = spreadsheetId;
    delete cache.spreadsheetsData[name];
    SheetCache.saveCache();
  }

  static existsSpreadsheet(name: string) {
    const cache = SheetCache.getCache();
    return !!cache.spreadsheetsData[name];
  }
  static getSpreadsheetData(name: string) {
    const cache = SheetCache.getCache();

    const spreadsheetId = cache.spreadsheetsData[name];
    if (!spreadsheetId) return;
    return SpreadsheetApp.openById(spreadsheetId);
  }

  static saveSpreadsheetID(name: string, id: string) {
    const cache = SheetCache.getCache();
    cache.spreadsheetsData[name] = id;
    SheetCache.saveCache();
  }
}
