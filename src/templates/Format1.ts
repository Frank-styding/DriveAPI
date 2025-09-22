import { QueueItem } from "../lib/QueueManager";
import { IFormat, SheetManager } from "../lib/SheetManager";
interface IConfig {
  tableNames: string[];
  headers: string[];
  formulas: Record<string, { formula: string; format: IFormat; color: string }>;
  rowFormulas: Record<string, string>;
  folderName: string;
}
const KEY = "Format_1_data";

export class Format1 {
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

  private static getFormulaTemplate(
    formula: Record<string, { formula: string; format: IFormat; color: string }>
  ) {
    const obj: Record<string, string> = {};
    Object.entries(formula).forEach(([key, value]) => {
      obj[key] = value.formula;
    });
    return obj;
  }

  static createFormat1Table(
    spreadsheetName: string,
    sheetName: string,
    tableName: string,
    headers: string[],
    formulas: Record<
      string,
      { formula: string; format: IFormat; color: string }
    >,
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
    SheetManager.Template.createWithTemplate(
      spreadsheetName,
      sheetName,
      startCol,
      startRow,
      this.createTemplateFormat1(
        headers,
        this.getFormulaTemplate(formulas),
        tableData
      ),
      [
        ...Object.values(formulas).map((value, index) => {
          return {
            range: [headers.length, tableEntries.length + index, 2, 1] as [
              number,
              number,
              number,
              number
            ],
            formats: [{ type: "background", data: { color: value.color } }],
          };
        }),
        {
          range: [headers.length, 0, 1, tableEntries.length],
          formats: [{ type: "background", data: { color: "#666666" } }],
        },
        {
          range: [0, 0, headers.length, 1],
          formats: [
            { type: "background", data: { color: "#f0f0f0" } },
            { type: "font", data: { bold: true } },
          ],
        },
      ]
    );

    if (config["headerFormats"]) {
      const startRow =
        SheetManager.Row.getMaxRow(spreadsheetName, sheetName, startCol) + 1;
      const columnFormats = Object.entries(
        config["headerFormats"] as ConfigFormat
      ).map(([key, value]) => ({
        col: +key + startCol,
        startRow,
        ...value,
      })) as IFormat[];

      SheetManager.Template.applyColumnFormats(
        spreadsheetName,
        sheetName,
        columnFormats
      );
    }

    SheetManager.Template.applyColumnFormats(
      spreadsheetName,
      sheetName,
      Object.values(formulas).map((value, index) => {
        if (!value.format) return;
        return {
          cellCol: headers.length + 1 + startCol,
          cellRow: tableEntries.length + 1 + index,
          ...value.format,
        };
      }) as IFormat[]
    );

    tableNames[sheetName].push(tableName);
    PropertiesService.getScriptProperties().setProperty(
      KEY,
      JSON.stringify(tableNames)
    );
    this.updateState(tableData, sheetName, config);
  }

  static updateState(
    tableData: Record<string, string>,
    sheetName: string,
    config: Record<string, any>
  ) {
    const place = sheetName.replace(/fundo_/g, "").replace(/_/g, " ");
    const dni = parseInt(tableData["dni"]);
    const usersSheet = config["usersSheet"];
    const usersSpreadsheet = config["usersSpreadsheet"];
    if (!usersSheet || !usersSpreadsheet) return;
    const userRows = SheetManager.Row.findRow(usersSpreadsheet, usersSheet, {
      dni,
    });
    const col = userRows.index + 2;
    if (col == 1) return;
    const spreadSheet =
      SheetManager.Spreadsheet.getSpreadSheet(usersSpreadsheet);
    if (!spreadSheet) return;
    const sheet = spreadSheet.getSheetByName(usersSheet);
    if (!sheet) return;
    sheet.getRange(col, 3).setValue(place);
  }

  static getTableNames() {
    const property = PropertiesService.getScriptProperties().getProperty(KEY);
    return (property ? JSON.parse(property) : {}) as Record<string, string[]>;
  }

  static getStarCol(headers: string[], sheetName: string, tableName: string) {
    /*     const property = PropertiesService.getScriptProperties().getProperty(KEY);
    const tableNames = (property ? JSON.parse(property) : {}) as Record<
      string,
      string[] */
    /* >; */
    const tableNames = this.getTableNames();
    if (!tableNames[sheetName]) {
      tableNames[sheetName] = [];
    }
    return tableNames[sheetName].indexOf(tableName) * (headers.length + 2) + 1;
  }

  static restoreFormta1Memory() {
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
    if (!SheetManager.Spreadsheet.existsSpreadsheet(spreadsheetName)) {
      SheetManager.Spreadsheet.createSpreadsheet(spreadsheetName, folderName);
      this.restoreFormta1Memory();
    }
    if (!SheetManager.Sheet.existsSheet(spreadsheetName, sheetName)) {
      SheetManager.Sheet.createSheet(spreadsheetName, sheetName);
    }

    Object.entries(groupDataByTable).forEach(([tableName, items]) => {
      const rows = items.map((item) =>
        headers.map((header) => {
          if (item.hasOwnProperty(header)) {
            return item[header];
          }
          if (rowFormulas && rowFormulas[header]) {
            return rowFormulas[header];
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
      if (rows.length > 0) {
        SheetManager.Row.insertRowsRange(
          spreadsheetName,
          sheetName,
          this.getStarCol(headers, sheetName, tableName),
          rows
        );
        SheetManager.Table.sortTable(
          spreadsheetName,
          sheetName,
          this.getStarCol(headers, sheetName, tableName),
          2,
          rows[0].length,
          1,
          true
        );
      }
    });
  }
}
