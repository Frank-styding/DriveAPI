import { DriveCache } from "./cache";
export class Folder {
  private constructor() {}

  static createFolder(name: string) {
    const cache = DriveCache.getCache();
    if (cache.foldersData[name]) return;
    const folder = DriveApp.createFolder(name);
    this.saveFolderID(name, folder.getId());
    DriveCache.saveCache();
    return folder;
  }

  static deleteFolder(name: string) {
    const cache = DriveCache.getCache();
    if (!cache.foldersData[name]) return;
    const folder = DriveApp.getFolderById(cache.foldersData[name]);
    folder.setTrashed(true);
    delete cache.foldersData[name];
    DriveCache.saveCache();
  }

  static renameFolder(name: string, newName: string) {
    const cache = DriveCache.getCache();
    if (!cache.foldersData[name]) return;
    const folder = DriveApp.getFolderById(cache.foldersData[name]);
    folder.setName(newName);
    this.saveFolderID(newName, folder.getId());
    delete cache.foldersData[name];
    DriveCache.saveCache();
  }

  static existsFolder(name: string) {
    const cache = DriveCache.getCache();
    return !!cache.foldersData[name];
  }

  static getFolderNames() {
    const cache = DriveCache.getCache();
    return Object.keys(cache.foldersData);
  }

  static getFolderID(name: string) {
    const cache = DriveCache.getCache();
    return cache.foldersData[name] || null;
  }
  static saveFolderID(name: string, id: string) {
    const cache = DriveCache.getCache();
    cache.foldersData[name] = id;
  }
}
