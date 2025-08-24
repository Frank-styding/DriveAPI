import { CacheManager } from "../CacheManager";
interface IDriveCache {
  foldersData: Record<string, string>;
  filesData: Record<string, string>;
  lastUpdated: number;
}

const DRIVE_KEY = "CACHE_DRIVE";
export class DriveCache {
  private constructor() {}
  static DRIVE_CACHE: IDriveCache;
  static saveCache() {
    CacheManager.saveCache<IDriveCache>(DRIVE_KEY, this.DRIVE_CACHE, {
      foldersData: {},
      filesData: {},
      lastUpdated: 0,
    });
  }

  static getCache() {
    this.DRIVE_CACHE = CacheManager.getCache<IDriveCache>(DRIVE_KEY, {
      foldersData: {},
      filesData: {},
      lastUpdated: 0,
    });

    return this.DRIVE_CACHE;
  }
  static clearCache() {
    CacheManager.clearCache(DRIVE_KEY);
  }
  static saveFolderID(name: string, id: string) {
    this.DRIVE_CACHE.foldersData[name] = id;
  }
  static saveFileID(name: string, id: string) {
    this.DRIVE_CACHE.filesData[name] = id;
  }
}
