import { DriveCache } from "./cache";

export class File {
  private constructor() {}
  static createFile(name: string, content: string, folderName?: string) {
    const cache = DriveCache.getCache();
    if (folderName && !cache.foldersData[folderName]) {
      throw new Error(`Folder ${folderName} does not exist.`);
    }
    const folderId = folderName ? cache.foldersData[folderName] : null;
    const file = DriveApp.createFile(name, content);
    if (folderId) {
      const folder = DriveApp.getFolderById(folderId);
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    }
    this.saveFileID(name, file.getId());
    DriveCache.saveCache();
    return file;
  }
  static createFileBase64(
    name: string,
    base64Content: string,
    folderName?: string,
    mineType?: string
  ) {
    const cache = DriveCache.getCache();
    if (folderName && !cache.foldersData[folderName]) {
      throw new Error(`Folder ${folderName} does not exist.`);
    }
    const folderId = folderName ? cache.foldersData[folderName] : null;
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Content));
    if (mineType) {
      blob.setContentType(mineType);
    }
    const file = DriveApp.createFile(blob.setName(name));
    if (folderId) {
      const folder = DriveApp.getFolderById(folderId);
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    }

    this.saveFileID(name, file.getId());
    DriveCache.saveCache();
  }
  static deleteFile(folderName: string, name: string) {
    const cache = DriveCache.getCache();
    if (!cache.foldersData[folderName]) return;
    const fileId = cache.filesData[name];
    if (!fileId) return;
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    delete cache.filesData[name];
    DriveCache.saveCache();
  }
  static renameFile(folderName: string, name: string, newName: string) {
    const cache = DriveCache.getCache();
    if (!cache.foldersData[folderName]) return;
    const fileId = cache.filesData[name];
    if (!fileId) return;
    const file = DriveApp.getFileById(fileId);
    file.setName(newName);
    this.saveFileID(newName, file.getId());
    delete cache.filesData[name];
    DriveCache.saveCache();
  }
  static existsFile(folderName: string, name: string) {
    const cache = DriveCache.getCache();
    if (!cache.foldersData[folderName]) return false;
    return !!cache.filesData[name];
  }
  static moveFile(
    sourceFolderName: string,
    toFolderName: string,
    fileName: string
  ) {
    const cache = DriveCache.getCache();
    if (
      !cache.foldersData[sourceFolderName] ||
      !cache.foldersData[toFolderName]
    )
      return;
    const fileId = cache.filesData[fileName];
    if (!fileId) return;
    const sourceFolder = DriveApp.getFolderById(
      cache.foldersData[sourceFolderName]
    );
    const toFolder = DriveApp.getFolderById(cache.foldersData[toFolderName]);
    const file = DriveApp.getFileById(fileId);
    toFolder.addFile(file);
    sourceFolder.removeFile(file);
  }

  static saveFileID(name: string, id: string) {
    const cache = DriveCache.getCache();
    cache.filesData[name] = id;
  }
}
