import { CacheManager } from "../CacheManager";

const SHEET_KEY = "SHEET_KEY";

interface ISheetCache {
  spreadsheets: Record<string, string>; // name -> spreadsheetId
  spreadsheetLastUpdates: Record<string, number>; // spreadsheetId -> last update
  tableCache: Record<string, Record<string, Record<string, any>[]>>; // spreadsheetId → sheetName → filas
  indexes: Record<
    string,
    {
      [sheetName: string]: {
        type: string;
        data: any;
      };
    }
  >; // spreadsheetId -> sheetName -> index info
  lastUpdated: number;
}

export class SheetCache {
  private constructor() {}
  static SHEET_CACHE: ISheetCache;

  static getCache() {
    if (this.SHEET_CACHE) return this.SHEET_CACHE;
    this.SHEET_CACHE = CacheManager.getCache<ISheetCache>(SHEET_KEY, {
      spreadsheets: {},
      lastUpdated: 0,
      spreadsheetLastUpdates: {},
      tableCache: {},
      indexes: {},
    });
    return this.SHEET_CACHE;
  }

  static saveCache() {
    CacheManager.saveCache<ISheetCache>(SHEET_KEY, this.SHEET_CACHE, {
      spreadsheets: {},
      tableCache: {},

      lastUpdated: 0,
      spreadsheetLastUpdates: {},
      indexes: {},
    });
  }

  // --- Spreadsheet IDs ---
  static saveSpreadsheetID(name: string, id: string) {
    this.getCache();
    this.SHEET_CACHE.spreadsheets[name] = id;
  }

  static getSpreadsheetID(name: string) {
    this.getCache();
    return this.SHEET_CACHE.spreadsheets[name];
  }

  // --- Indexes ---
  static saveIndex(
    spreadsheetId: string,
    sheetName: string,
    type: string,
    data: any
  ) {
    this.getCache();
    if (!this.SHEET_CACHE.indexes[spreadsheetId]) {
      this.SHEET_CACHE.indexes[spreadsheetId] = {};
    }
    this.SHEET_CACHE.indexes[spreadsheetId][sheetName] = { type, data };
  }

  static getIndex(spreadsheetId: string, sheetName: string) {
    this.getCache();
    return this.SHEET_CACHE.indexes[spreadsheetId]?.[sheetName];
  }

  // --- Utility ---
  static clearCache() {
    this.SHEET_CACHE = {
      spreadsheets: {},
      tableCache: {},
      lastUpdated: 0,
      spreadsheetLastUpdates: {},
      indexes: {},
    };
    CacheManager.clearCache(SHEET_KEY);
  }
}
