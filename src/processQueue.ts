import { Utils } from "./utils";
import { QueueItem, QueueManager } from "./QueueManager";
import { SheetManager } from "./SheetManager";

export function processQueue(config: Record<string, any>) {
  const queue = [...QueueManager.getQueue()];
  if (queue.length === 0) {
    return ContentService.createTextOutput("No items in queue");
  }

  // Group items by spreadsheetName and sheetName
  const groupedData: Record<string, Record<string, QueueItem[]>> = {};
  queue
    .filter((item) => item.type === "insertRow")
    .forEach((item) => {
      const spreadsheetName =
        item.data.spreadsheetName || Utils.formatDate(new Date());
      const sheetName = item.data.sheetName || Utils.formatDate(new Date());
      if (!groupedData[spreadsheetName]) {
        groupedData[spreadsheetName] = {};
      }
      if (!groupedData[spreadsheetName][sheetName]) {
        groupedData[spreadsheetName][sheetName] = [];
      }
      groupedData[spreadsheetName][sheetName].push(item);
    });

  Object.keys(groupedData).forEach((spreadsheetName) => {
    const sheets = groupedData[spreadsheetName];
    Object.keys(sheets).forEach((sheetName) => {
      const data = sheets[sheetName];
      const columns = config["columns"] || [];
      const folderName = config["folderName"] || "data";
      if (!SheetManager.existsSpreadsheet(spreadsheetName)) {
        SheetManager.createSpreadsheet(spreadsheetName, folderName);
      }
      if (!SheetManager.existsSheet(spreadsheetName, sheetName)) {
        SheetManager.createSheet(spreadsheetName, sheetName);
        SheetManager.createtTable(spreadsheetName, sheetName, columns);
      }
      SheetManager.insertRows(
        spreadsheetName,
        sheetName,
        data.map((item) => item.data.data) as Record<string, any>[]
      );
      // Remove processed items from the queue
      QueueManager.removeManyFromQueue(data.map((item) => item.id));
    });
  });
}
