import { DriveCache } from "./cache";

export class File {
  private constructor() {}

  static getImageData(
    fileName: string,
    folderName?: string
  ): { base64: string; mimeType: string } | null {
    const cache = DriveCache.getCache();

    try {
      let folderId: string | null = null;
      if (folderName) {
        if (!cache.foldersData[folderName]) {
          const folders = DriveApp.getFoldersByName(folderName);
          if (folders.hasNext()) {
            const folder = folders.next();
            cache.foldersData[folderName] = folder.getId();
            DriveCache.saveCache();
            folderId = folder.getId();
          } else {
            return null;
          }
        } else {
          folderId = cache.foldersData[folderName];
        }
      }

      let fileId = cache.filesData[fileName];
      let file: GoogleAppsScript.Drive.File;

      if (!fileId) {
        let fileIterator: GoogleAppsScript.Drive.FileIterator;

        if (folderId) {
          const folder = DriveApp.getFolderById(folderId);
          fileIterator = folder.getFilesByName(fileName);
        } else {
          fileIterator = DriveApp.getFilesByName(fileName);
        }

        if (fileIterator.hasNext()) {
          file = fileIterator.next();
          fileId = file.getId();

          this.saveFileID(fileName, fileId);
          DriveCache.saveCache();
        } else {
          return null;
        }
      } else {
        file = DriveApp.getFileById(fileId);
      }

      const mimeType = file.getMimeType();
      if (!mimeType.startsWith("image/")) {
        return null;
      }
      const blob = file.getBlob();
      const bytes = blob.getBytes();
      const base64Data = Utilities.base64Encode(bytes);

      return {
        base64: base64Data,
        mimeType: mimeType,
      };
    } catch (error) {
      console.error(`Error obteniendo imagen ${fileName}: ${error}`);
      return null;
    }
  }

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
