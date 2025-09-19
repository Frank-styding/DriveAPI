import { QueueItem } from "../lib/QueueManager";
import { SheetManager } from "../lib/SheetManager";

export class Default {
  static processInsertRow(
    data: QueueItem[],
    sheetName: string,
    config: Record<string, any>,
    spreadsheetName: string
  ) {
    const columns = config["columns"] || [];
    const folderName = config["folderName"] || "data";
    if (!SheetManager.Spreadsheet.existsSpreadsheet(spreadsheetName)) {
      SheetManager.Spreadsheet.createSpreadsheet(spreadsheetName, folderName);
    }
    if (!SheetManager.Sheet.existsSheet(spreadsheetName, sheetName)) {
      SheetManager.Sheet.createSheet(spreadsheetName, sheetName);
      SheetManager.Table.createtTable(spreadsheetName, sheetName, columns);
    }
    SheetManager.Row.insertRows(
      spreadsheetName,
      sheetName,
      data.map((item) => item.data.data) as Record<string, any>[]
    );
  }
}
