import { File } from "./File";
import { Folder } from "./folderMethods";
import { DriveCache } from "./cache";
export const DriveManager = {
  File,
  Folder,
  clearCache: DriveCache.clearCache,
};
