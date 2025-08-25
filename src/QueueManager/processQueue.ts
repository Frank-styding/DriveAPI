import { Template } from "../templates";
import { Utils } from "../utils/utils";
import { Queue } from "./queue";
import { QueueItem } from "./QueueItem";
export const operations = ["insertRow", "insertFormat_1"];
export class ProcessQueue {
  private constructor() {}
  static processQueue(config: Record<string, any>) {
    const queue = [...Queue.getQueue()];
    if (queue.length === 0) {
      return;
    }
    this.processType(
      queue,
      "insertRow",
      config,
      (data, sheetName, config, spreadsheetName) => {
        Template.Default.processInsertRow(
          data,
          sheetName,
          config,
          spreadsheetName
        );
      }
    );
    this.processType(
      queue,
      "insertFormat_1",
      config,
      (data, sheetName, config, spreadsheetName) => {
        Template.Format1.processFormat1(
          data,
          sheetName,
          config,
          spreadsheetName
        );
      }
    );
    Queue.removeManyFromQueue(queue.map((item) => item.id));
  }

  static processType(
    queue: QueueItem[],
    type: string,
    config: Record<string, any>,
    callback: (
      data: QueueItem[],
      sheetName: string,
      config: Record<string, any>,
      spreadsheetName: string
    ) => void
  ) {
    const insertRowQueue = queue.filter((item) => item.type === type);
    if (insertRowQueue.length == 0) return;
    const groupedData: Record<string, Record<string, QueueItem[]>> = {};
    insertRowQueue.forEach((item) => {
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
        callback(data, sheetName, config, spreadsheetName);
      });
    });
  }
}
