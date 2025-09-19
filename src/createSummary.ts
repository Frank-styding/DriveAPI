import { ConfigManger } from "./config/ConfigManger";
import { IFormat, SheetManager } from "./lib/SheetManager";
import { SheetCache } from "./lib/SheetManager/cache";
import { Spreadsheet } from "./lib/SheetManager/spreadsheet";
import { Format1 } from "./templates/Format1";

interface IConfig {
  tableNames: string[];
  headers: string[];
  formulas: Record<string, { formula: string; format: IFormat; color: string }>;
  rowFormulas: Record<string, string>;
  folderName: string;
}

export class CreateSummary {
  private constructor() {}

  private static getSheetCols(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
    const { headers, formulas } = ConfigManger.getConfig() as IConfig;
    const sheetName = sheet.getName();
    if (!sheetName) return;
    const tableNames = Format1.getTableNames()[sheetName];
    if (tableNames.length == 0) return;
    const col = headers.length + 1;
    const formulaLength = Object.keys(formulas).length + 2;
    const cols = [];
    for (let i = 0; i < tableNames.length; i++) {
      const tableName = tableNames[i];
      const startCol = Format1.getStarCol(headers, sheet.getName(), tableName);
      const dataRange = sheet.getRange(1, startCol + col, formulaLength);
      let dataValues = dataRange.getValues().flat();
      dataValues.unshift(sheetName.replace(/fundo_/g, "").replace(/_/g, ""));
      dataValues = dataValues.map((value) => {
        if (value instanceof Date) {
          const hours = String(value.getHours()).padStart(2, "0");
          const minutes = String(value.getMinutes()).padStart(2, "0");
          return `${hours}:${minutes}`;
        }
        if (typeof value == "number") {
          return value.toString();
        }
        return value;
      });
      cols.push(dataValues);
    }
    return cols;
  }

  private static getSpreadsheetCols() {
    const sheets = this.getSheets();
    const allCols: string[][] = [];
    sheets.forEach((sheet) => {
      const cols = this.getSheetCols(sheet);
      if (cols) allCols.push(...cols);
    });
    return allCols;
  }

  private static getSheets() {
    const spreadsheet_name = `cosecha_${this.getCurrentTime()}`;
    if (!SheetManager.Spreadsheet.existsSpreadsheet(spreadsheet_name))
      return [];
    return SheetManager.Sheet.getSheets(spreadsheet_name);
  }

  private static getCurrentTime() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  }

  static createSummarySheet() {
    const { formulas } = ConfigManger.getConfig() as IConfig;
    const spreadsheet_name = `cosecha_${this.getCurrentTime()}`;
    const sheet_name = "Resumen";
    const headers = ["Fundo", "dni", "Capitán", ...Object.keys(formulas)];
    const cols = this.getSpreadsheetCols();
    if (cols.length === 0) return;
    SheetManager.Sheet.createSheet(spreadsheet_name, sheet_name);
    SheetManager.Template.createWithTemplate(
      spreadsheet_name,
      sheet_name,
      1,
      1,
      [headers, ...cols],
      [
        {
          range: [0, 0, headers.length, 1],
          formats: [{ type: "background", data: { color: "#ff9900" } }],
        },
      ]
    );

    SheetManager.Template.applyColumnFormats(
      spreadsheet_name,
      sheet_name,
      Object.values(headers).map((_, i) => {
        return {
          cellCol: i + 1,
          cellRow: 1,
          numberFormat: "[h]:mm:ss",
        };
      })
    );
    this.createPivotTable(
      spreadsheet_name,
      sheet_name,
      headers.length,
      cols.length + 1
    );
  }
  private static createPivotTable(
    spreadsheetName: string,
    sheetName: string,
    totalCols: number,
    totalRows: number
  ) {
    const cache = SheetCache.getCache();
    const spreadsheetId = cache.spreadsheets[spreadsheetName];
    if (!spreadsheetId) throw new Error("Spreadsheet does not exist.");
    const spreadsheet = Spreadsheet.getSpreadsheet(spreadsheetId);
    if (!spreadsheet) return;
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet does not exist.");
    let pivotSheet = spreadsheet.getSheetByName("Pivot_Resumen");
    if (pivotSheet) {
      pivotSheet.clear();
    } else {
      pivotSheet = spreadsheet.insertSheet("Pivot_Resumen");
    }
    const range = sheet.getRange(1, 1, totalRows, totalCols);
    const pivotTable = pivotSheet.getRange(1, 1).createPivotTable(range);
    pivotTable.addRowGroup(3);
    pivotTable.addRowGroup(1);
    for (let i = 4; i <= totalCols; i++) {
      pivotTable.addPivotValue(
        i,
        SpreadsheetApp.PivotTableSummarizeFunction.SUM
      );
    }
    const lastCol = pivotSheet.getLastColumn();
    const lastRow = pivotSheet.getLastRow();
    if (lastCol > 0 && lastRow > 0) {
      pivotSheet.getRange(1, 1, lastRow, lastCol).setNumberFormat("[h]:mm");
    }
  }
}
