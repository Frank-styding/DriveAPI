/* import { CacheManager } from "../CacheManager";
interface ISheetCache {
  spreadsheetsData: Record<string, string>;
  lastUpdated: number;
}

let SHEET_CACHE: undefined | ISheetCache;
const CACHE_KEY = "SHEET_CACHE"; */
/* export function initialize() {
  if (SHEET_CACHE != undefined) return;
  SHEET_CACHE = { spreadsheetsData: {}, lastUpdated: 0 };
  CacheManager.saveCache(CACHE_KEY, SHEET_CACHE);
}

export function getCache(): ISheetCache {
  initialize();
  return SHEET_CACHE || { spreadsheetsData: {}, lastUpdated: 0 };
}

export function saveCache(): void {
  CacheManager.saveCache(
    CACHE_KEY,
    SHEET_CACHE || { spreadsheetsData: {}, lastUpdated: 0 }
  );
}

export function getSpreadsheetCache(name: string): string | undefined {
  getCache();
  if (!SHEET_CACHE) return undefined;
  return SHEET_CACHE.spreadsheetsData[name];
}

export function saveSpreadsheetID(name: string, id: string): void {
  (SHEET_CACHE || { spreadsheetsData: {}, lastUpdated: 0 }).spreadsheetsData[
    name
  ] = id;
}

export function clearCache(): void {
  Cache.clearCache(CACHE_KEY);
}
 */
