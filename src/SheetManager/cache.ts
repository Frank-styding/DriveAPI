import { CacheManager } from "../CacheManager";

const SHEET_KEY = "SHEET_KEY";

interface ISheetCache {
  spreadsheetsData: Record<string, string>;
  lastUpdated: number;
}

export class SheetCache {
  private constructor() {}
  static SHEET_CACHE: ISheetCache;

  static getCache() {
    if (this.SHEET_CACHE) return this.SHEET_CACHE;
    this.SHEET_CACHE = CacheManager.getCache<ISheetCache>(SHEET_KEY, {
      spreadsheetsData: {},
      lastUpdated: 0,
    });
    return this.SHEET_CACHE;
  }

  static getSpreadsheetCache(name: string) {
    this.getCache();
    return this.SHEET_CACHE.spreadsheetsData[name];
  }

  static saveCache() {
    CacheManager.saveCache<ISheetCache>(SHEET_KEY, this.SHEET_CACHE, {
      spreadsheetsData: {},
      lastUpdated: 0,
    });
  }

  static saveSpreadsheetID(name: string, id: string) {
    this.SHEET_CACHE.spreadsheetsData[name] = id;
  }

  static getSpreadsheetID(name: string) {
    return this.SHEET_CACHE.spreadsheetsData[name];
  }

  static clearCache() {
    this.SHEET_CACHE = { spreadsheetsData: {}, lastUpdated: 0 };
    CacheManager.clearCache(SHEET_KEY);
  }
}
