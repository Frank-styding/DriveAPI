/* function createSpreadsheet(name: string, folderName?: string) {
  this.getCache();
  if (this.cache.spreadsheetsData[name]) return;
  const spreadsheet = SpreadsheetApp.create(name);
  if (folderName) {
    let folderId = DriveManager.getFolderID(folderName);
    if (!folderId) {
      folderId = DriveManager.createFolder(folderName)?.getId() as string;
    }
    if (!folderId) throw new Error(`Folder ${folderName} does not exist.`);
    const folder = DriveApp.getFolderById(folderId);
    const file = DriveApp.getFileById(spreadsheet.getId());
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
  }
  this.saveSpreadsheetID(name, spreadsheet.getId());
  this.saveCache();
}
 */
