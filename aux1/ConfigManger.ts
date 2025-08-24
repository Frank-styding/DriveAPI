import { DriveManager } from "./DriveManger";
import { ProcessQueue } from "./processQueue";
import { QueueManager } from "./QueueManager";
import { SheetManager } from "../src/SheetManager";
import { TriggerManager } from "./TriggerManager";

/**
 * ConfigManger handles configuration and administrative operations for the API, such as triggers and cache management.
 */
export class ConfigManger {
  private constructor() {}
  /**
   * Processes a configuration or administrative operation based on the provided data.
   * @param data Operation data object
   * @returns ContentService output
   */
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
        QueueManager.clearQueue();
        return ContentService.createTextOutput("Queue cleared");
      }
      case "clearSheetCache": {
        SheetManager.clearCache();
        return ContentService.createTextOutput("Queue cleared");
      }
      case "clearDriveCache": {
        SheetManager.clearCache();
        return ContentService.createTextOutput("Drive cache cleared");
      }
      case "clearCache": {
        SheetManager.clearCache();
        QueueManager.clearQueue();
        DriveManager.clearCache();
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
        TriggerManager.deleteAllTriggers(); // Clear existing triggers
        TriggerManager.createTrigger(data["time"]); // Trigger after 60 seconds
        break;
      }
      default:
        return ContentService.createTextOutput("Unknown operation");
    }
  }
  /**
   * Sets a configuration property in the script properties.
   * @param data Configuration data object
   */
  static setProperty(data: Record<string, any>) {
    if (!data) return;
    PropertiesService.getScriptProperties().setProperty(
      "config",
      JSON.stringify(data)
    );
  }
  /**
   * Sets or processes configuration based on the data provided.
   * @param data Configuration data object
   * @returns ContentService output
   */
  static setConfig(data: Record<string, any>) {
    if (data["operation"] != undefined) {
      this.processOperation(data);
    } else {
      this.setProperty(data);
    }
    return ContentService.createTextOutput("Configuration updated");
  }
  /**
   * Retrieves the current configuration from script properties.
   * @returns Configuration object
   */
  static getConfig() {
    const config =
      PropertiesService.getScriptProperties().getProperty("config");
    if (!config) {
      return {};
    }
    return JSON.parse(config);
  }
  /**
   * Clears the configuration from script properties.
   */
  static clearConfig() {
    PropertiesService.getScriptProperties().deleteProperty("config");
  }
}
