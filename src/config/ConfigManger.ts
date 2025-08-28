import { DriveManager } from "../DriveManager";
import { ProcessQueue } from "../QueueManager/processQueue";
import { Queue } from "../QueueManager/queue";
import { SheetManager } from "../SheetManager/index";
import { TriggerManager } from "../TriggerManager/TriggerManager";

export class ConfigManger {
  private constructor() {}

  static processOperation(data: Record<string, any>) {
    const operation = data["operation"];
    if (!operation) {
      return ContentService.createTextOutput("No operation specified");
    }
    switch (operation) {
      case "deleteTriggers": {
        const triggers = ScriptApp.getProjectTriggers();
        triggers.forEach((trigger) => ScriptApp.deleteTrigger(trigger));
        return ContentService.createTextOutput("Triggers deleted");
      }
      case "clearQueue": {
        Queue.clearQueue();
        return ContentService.createTextOutput("Queue cleared");
      }
      case "clearSheetCache": {
        SheetManager.cache.clearCache();
        return ContentService.createTextOutput("Queue cleared");
      }
      case "clearDriveCache": {
        SheetManager.cache.clearCache();
        return ContentService.createTextOutput("Drive cache cleared");
      }
      case "clearCache": {
        SheetManager.cache.clearCache();
        Queue.clearQueue();
        DriveManager.cache.clearCache();
        return ContentService.createTextOutput("All cache cleared");
      }
      case "processQueue": {
        const config = this.getConfig();
        return ProcessQueue.processQueue(config);
      }
      case "clearTriggers": {
        TriggerManager.deleteAllTriggers();
        break;
      }
      case "initProcessQueueTrigger": {
        TriggerManager.deleteAllTriggers();
        TriggerManager.createTrigger(data["time"]);
        break;
      }
      default:
        return ContentService.createTextOutput("Unknown operation");
    }
  }
  static setProperty(data: Record<string, any>) {
    if (!data) return;
    PropertiesService.getScriptProperties().setProperty(
      "config",
      JSON.stringify(data)
    );
  }

  static getConfig() {
    const config =
      PropertiesService.getScriptProperties().getProperty("config");
    if (!config) {
      return {};
    }
    return JSON.parse(config);
  }

  static clearConfig() {
    PropertiesService.getScriptProperties().deleteProperty("config");
  }
}
