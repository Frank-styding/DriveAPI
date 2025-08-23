import { QueueItem, QueueManager } from "./QueueManager";
import { IFormat, SheetManager } from "./SheetManager";
import { Utils } from "./utils";
interface IConfig {
  tableNames: string[];
  headers: string[];
  formulas: Record<string, string>;
  rowFormulas: Record<string, string>;
  folderName: string;
}
export const operations = ["insertRow", "insertFormat_1"];
export class ProcessQueue {
  private constructor() {}
  static processQueue(config: Record<string, any>) {
    const queue = [...QueueManager.getQueue()];
    if (queue.length === 0) {
      return ContentService.createTextOutput("No items in queue");
    }
    this.processType(
      queue,
      "insertRow",
      config,
      this.processInsertRow.bind(this)
    );
    this.processType(
      queue,
      "insertFormat_1",
      config,
      this.processFormat1.bind(this)
    );
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

  static processInsertRow(
    data: QueueItem[],
    sheetName: string,
    config: Record<string, any>,
    spreadsheetName: string
  ) {
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
    QueueManager.removeManyFromQueue(data.map((item) => item.id));
  }

  static createTemplateFormat1(
    headers: string[],
    formulas: Record<string, string>,
    tableData: Record<string, string>
  ) {
    const formulaEntries = Object.entries(formulas);
    const tableEntries = Object.entries(tableData);
    const cols = headers.length + 2;
    const rows = tableEntries.length + formulaEntries.length;
    const colList: string[][] = [];
    for (let i = 0; i < rows; i++) {
      const rowList: string[] = [];
      for (let j = 0; j < cols; j++) {
        if (i == 0 && j < headers.length) {
          rowList.push(headers[j]);
        }
        if (i > 0 && j < headers.length) {
          rowList.push("");
        }
        if (j == headers.length + 1 && i < tableEntries.length) {
          rowList.push(...tableEntries[i]);
        }
        if (j == headers.length + 1 && i >= tableEntries.length) {
          rowList.push(...formulaEntries[i - tableEntries.length]);
        }
      }
      colList.push(rowList);
    }
    return colList;
  }

  static createFormat1Table(
    spreadsheetName: string,
    sheetName: string,
    tableName: string,
    headers: string[],
    formulas: Record<string, string>,
    tableData: Record<string, string>,
    config: Record<string, any>
  ) {
    type ConfigFormat = Record<
      string,
      {
        conditionalRules: IFormat["conditionalRules"];
        numberFormat: IFormat["numberFormat"];
      }
    >;

    const KEY = "Format_1_data";
    const property = PropertiesService.getScriptProperties().getProperty(KEY);
    const tableNames = (property ? JSON.parse(property) : {}) as Record<
      string,
      string[]
    >;
    if (!tableNames[sheetName]) {
      tableNames[sheetName] = [];
    }

    if (tableNames[sheetName].includes(tableName)) return;
    const startCol = tableNames[sheetName].length * (headers.length + 2) + 1;
    const startRow = 1;
    const formulaEntries = Object.entries(formulas);
    const tableEntries = Object.entries(tableData);
    const rows = tableEntries.length + formulaEntries.length;
    SheetManager.createWithTemplate(
      spreadsheetName,
      sheetName,
      startCol,
      startRow,
      this.createTemplateFormat1(headers, formulas, tableData),
      [
        {
          range: [headers.length, 0, 1, rows],
          formats: [{ type: "background", data: { color: "yellow" } }],
        },
        {
          range: [0, 0, headers.length, 1],
          formats: [
            { type: "background", data: { color: "#f0f0f0" } },
            { type: "font", data: { bold: true } },
          ],
        },
        {
          range: [headers.length, 0, 2, rows],
          formats: [
            {
              type: "border",
              data: {
                borders: [true, true, true, true, true, true, null, null],
              },
            },
          ],
        },
      ]
    );

    if (config["headerFormats"]) {
      const startRow =
        SheetManager.getMaxRow(spreadsheetName, sheetName, startCol) + 1;
      const columnFormats = Object.entries(
        config["headerFormats"] as ConfigFormat
      ).map(([key, value]) => ({
        col: +key + startCol,
        startRow,
        ...value,
      })) as IFormat[];

      SheetManager.applyColumnFormats(
        spreadsheetName,
        sheetName,
        columnFormats
      );
    }

    if (config["formulasFormat"]) {
      const formulasFormat = Object.entries(
        config["formulasFormat"] as ConfigFormat
      ).map(([key, value]) => ({
        cellCol: headers.length + 2 + startCol,
        ///!  change this if you change template
        cellRow:
          tableEntries.length +
          1 +
          formulaEntries.findIndex(([i, _]) => i == key),
        ...value,
      })) as IFormat[];
      SheetManager.applyColumnFormats(
        spreadsheetName,
        sheetName,
        formulasFormat
      );
    }

    tableNames[sheetName].push(tableName);
    PropertiesService.getScriptProperties().setProperty(
      KEY,
      JSON.stringify(tableNames)
    );
  }
  static getStarCol(headers: string[], sheetName: string, tableName: string) {
    const KEY = "Format_1_data";
    const property = PropertiesService.getScriptProperties().getProperty(KEY);
    const tableNames = (property ? JSON.parse(property) : {}) as Record<
      string,
      string[]
    >;
    if (!tableNames[sheetName]) {
      tableNames[sheetName] = [];
    }
    return tableNames[sheetName].indexOf(tableName) * (headers.length + 2) + 1;
  }

  static restoreFormta1Memory() {
    const KEY = "Format_1_data";
    PropertiesService.getScriptProperties().deleteProperty(KEY);
  }

  static processFormat1(
    data: QueueItem[],
    sheetName: string,
    config: Record<string, any>,
    spreadsheetName: string
  ) {
    let { headers, formulas, rowFormulas, folderName } = config as IConfig;
    if (!formulas) formulas = {};
    if (!rowFormulas) rowFormulas = {};

    const groupDataByTable: Record<string, Record<string, any>[]> = {};
    const tableData: Record<string, Record<string, string>> = {};
    data.forEach((item) => {
      const tableName = item.data.data["tableName"];
      if (!groupDataByTable[tableName]) {
        groupDataByTable[tableName] = [];
        tableData[tableName] = item.data.data["tableData"];
      }
      groupDataByTable[tableName].push(...item.data.data["items"]);
    });
    if (!SheetManager.existsSpreadsheet(spreadsheetName)) {
      SheetManager.createSpreadsheet(spreadsheetName, folderName);
      this.restoreFormta1Memory();
    }
    if (!SheetManager.existsSheet(spreadsheetName, sheetName)) {
      SheetManager.createSheet(spreadsheetName, sheetName);
    }

    Object.entries(groupDataByTable).forEach(([tableName, items]) => {
      const rows = items.map((item) =>
        headers.map((header) => {
          if (item.hasOwnProperty(header)) {
            return item[header];
          }
          if (rowFormulas && rowFormulas[header]) {
            return "formula:" + rowFormulas[header];
          }
          return "";
        })
      );
      this.createFormat1Table(
        spreadsheetName,
        sheetName,
        tableName,
        headers,
        formulas,
        tableData[tableName],
        config
      );
      SheetManager.insertRowsRange(
        spreadsheetName,
        sheetName,
        this.getStarCol(headers, sheetName, tableName),
        rows
      );
    });
  }
}
