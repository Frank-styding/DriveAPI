interface DriveCache {
  foldersData: Record<string, string>;
  filesData: Record<string, string>;
  lastUpdated: number;
}
/**
 * DriveManager provides static methods to manage Google Drive folders and files with local cache support.
 * It allows creation, deletion, renaming, moving, and cache management for folders and files.
 */
export class DriveManager {
  private constructor() {}
  //? folder methods
  //#region Folder Methods
  /**
   * Creates a new folder in Google Drive and saves its ID in the cache.
   * @param name Folder name
   * @returns The created folder object
   */
  static createFolder(name: string) {
    this.getCache();
    if (this.driveCache.foldersData[name]) return;
    const folder = DriveApp.createFolder(name);
    this.saveFolderID(name, folder.getId());
    this.saveCache();
    return folder;
  }
  /**
   * Deletes a folder from Google Drive and removes it from the cache.
   * @param name Folder name
   */
  static deleteFolder(name: string) {
    this.getCache();
    if (!this.driveCache.foldersData[name]) return;
    const folder = DriveApp.getFolderById(this.driveCache.foldersData[name]);
    folder.setTrashed(true);
    delete this.driveCache.foldersData[name];
    this.saveCache();
  }
  /**
   * Renames a folder in Google Drive and updates the cache.
   * @param name Current folder name
   * @param newName New folder name
   */
  static renameFolder(name: string, newName: string) {
    this.getCache();
    if (!this.driveCache.foldersData[name]) return;
    const folder = DriveApp.getFolderById(this.driveCache.foldersData[name]);
    folder.setName(newName);
    this.saveFolderID(newName, folder.getId());
    delete this.driveCache.foldersData[name];
    this.saveCache();
  }
  /**
   * Checks if a folder exists in the cache.
   * @param name Folder name
   * @returns True if the folder exists, false otherwise
   */
  static existsFolder(name: string) {
    this.getCache();
    return !!this.driveCache.foldersData[name];
  }
  /**
   * Returns all folder names stored in the cache.
   * @returns Array of folder names
   */
  static getFolderNames() {
    this.getCache();
    return Object.keys(this.driveCache.foldersData);
  }
  /**
   * Gets the ID of a folder from the cache.
   * @param name Folder name
   * @returns Folder ID or null if not found
   */
  static getFolderID(name: string) {
    this.getCache();
    return this.driveCache.foldersData[name] || null;
  }
  //#endregion
  //? file methods
  //#region File Methods
  /**
   * Creates a file in Google Drive, optionally inside a folder, and saves its ID in the cache.
   * @param name File name
   * @param content File content
   * @param folderName (Optional) Folder name
   * @returns The created file object
   */
  static createFile(name: string, content: string, folderName?: string) {
    this.getCache();
    if (folderName && !this.driveCache.foldersData[folderName]) {
      throw new Error(`Folder ${folderName} does not exist.`);
    }
    const folderId = folderName
      ? this.driveCache.foldersData[folderName]
      : null;
    const file = DriveApp.createFile(name, content);
    if (folderId) {
      const folder = DriveApp.getFolderById(folderId);
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    }
    this.saveFileID(name, file.getId());
    this.saveCache();
    return file;
  }
  /**
   * Creates a file from a base64 string in Google Drive, optionally inside a folder, and saves its ID in the cache.
   * @param name File name
   * @param base64Content Base64-encoded file content
   * @param folderName (Optional) Folder name
   * @param mineType (Optional) MIME type
   */
  static createFileBase64(
    name: string,
    base64Content: string,
    folderName?: string,
    mineType?: string
  ) {
    this.getCache();
    if (folderName && !this.driveCache.foldersData[folderName]) {
      throw new Error(`Folder ${folderName} does not exist.`);
    }
    const folderId = folderName
      ? this.driveCache.foldersData[folderName]
      : null;
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
    this.saveCache();
  }
  /**
   * Deletes a file from a folder in Google Drive and removes it from the cache.
   * @param folderName Folder name
   * @param name File name
   */
  static deleteFile(folderName: string, name: string) {
    this.getCache();
    if (!this.driveCache.foldersData[folderName]) return;
    const fileId = this.driveCache.filesData[name];
    if (!fileId) return;
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    delete this.driveCache.filesData[name];
    this.saveCache();
  }
  /**
   * Renames a file in a folder in Google Drive and updates the cache.
   * @param folderName Folder name
   * @param name Current file name
   * @param newName New file name
   */
  static renameFile(folderName: string, name: string, newName: string) {
    this.getCache();
    if (!this.driveCache.foldersData[folderName]) return;
    const fileId = this.driveCache.filesData[name];
    if (!fileId) return;
    const file = DriveApp.getFileById(fileId);
    file.setName(newName);
    this.saveFileID(newName, file.getId());
    delete this.driveCache.filesData[name];
    this.saveCache();
  }
  /**
   * Checks if a file exists in a folder in the cache.
   * @param folderName Folder name
   * @param name File name
   * @returns True if the file exists, false otherwise
   */
  static existsFile(folderName: string, name: string) {
    this.getCache();
    if (!this.driveCache.foldersData[folderName]) return false;
    return !!this.driveCache.filesData[name];
  }
  //? move file methods
  //#region Move File Methods
  /**
   * Moves a file from one folder to another in Google Drive.
   * @param sourceFolderName Source folder name
   * @param toFolderName Destination folder name
   * @param fileName File name
   */
  static moveFile(
    sourceFolderName: string,
    toFolderName: string,
    fileName: string
  ) {
    this.getCache();
    if (
      !this.driveCache.foldersData[sourceFolderName] ||
      !this.driveCache.foldersData[toFolderName]
    )
      return;
    const fileId = this.driveCache.filesData[fileName];
    if (!fileId) return;
    const sourceFolder = DriveApp.getFolderById(
      this.driveCache.foldersData[sourceFolderName]
    );
    const toFolder = DriveApp.getFolderById(
      this.driveCache.foldersData[toFolderName]
    );
    const file = DriveApp.getFileById(fileId);
    toFolder.addFile(file);
    sourceFolder.removeFile(file);
  }
  //#endregion

  //#region cache
  /**
   * Saves a file ID in the cache.
   * @param name File name
   * @param id File ID
   */
  static saveFileID(name: string, id: string) {
    this.driveCache.filesData[name] = id;
  }
  /**
   * Saves a folder ID in the cache.
   * @param name Folder name
   * @param id Folder ID
   */
  private static saveFolderID(name: string, id: string) {
    this.driveCache.foldersData[name] = id;
  }
  private static driveCache: DriveCache;
  /**
   * Initializes the drive cache if not already initialized.
   */
  private static initialize() {
    if (this.driveCache != undefined) return;
    this.driveCache = {
      foldersData: {},
      filesData: {},
      lastUpdated: 0,
    };
  }
  /**
   * Saves the current drive cache to PropertiesService.
   */
  private static saveCache() {
    PropertiesService.getScriptProperties().setProperty(
      `driveCache`,
      JSON.stringify(this.driveCache)
    );
  }
  /**
   * Loads the drive cache from PropertiesService.
   */
  private static getCache() {
    this.initialize();
    const data =
      PropertiesService.getScriptProperties().getProperty(`driveCache`);
    if (!data) return;
    this.driveCache = JSON.parse(data) as DriveCache;
  }
  /**
   * Clears the drive cache and removes it from PropertiesService.
   */
  static clearCache() {
    this.driveCache = {
      foldersData: {},
      filesData: {},
      lastUpdated: 0,
    };
    PropertiesService.getScriptProperties().deleteProperty(`driveCache`);
  }
  //#endregion
}
