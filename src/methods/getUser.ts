import { RequestLock } from "../RequestLock/RequestLock";
import { SheetManager } from "../SheetManager";
import { Body, Route } from "./Route";

interface BodyData {
  dni: string;
}

export const spreadsheetName = "capitanes_data";
export const sheetName = "Capitanes";
export const sheetName1 = "Contraseña";
export class RouteGetUser extends Route {
  static override method(body: Body<BodyData>, requestId: string) {
    if (body.type !== "getUser") return null;
    SheetManager.Spreadsheet.registerSpreadsheet(spreadsheetName);
    /*     if (!SheetManager.Spreadsheet.existsSpreadsheet(spreadsheetName)) {
      SheetManager.Spreadsheet.createSpreadsheet(spreadsheetName);
      SheetManager.Sheet.createSheet(spreadsheetName, sheetName);
      SheetManager.Sheet.createSheet(spreadsheetName, sheetName1);
      SheetManager.Sheet.deleteSheet(spreadsheetName, "Hoja 1");
      SheetManager.Table.createtTable(spreadsheetName, sheetName, [
        "dni",
        "nombre",
      ]);
      SheetManager.Template.createWithTemplate(
        spreadsheetName,
        sheetName1,
        1,
        1,
        [["Contraseña", ""]]
      );
    }
    if (SheetManager.Spreadsheet.hasSpreadsheetChanged(spreadsheetName)) {
      SheetManager.Table.buildColumnIndex(spreadsheetName, sheetName, 1);
    } */
    const row = SheetManager.Table.findByColumnValue(
      spreadsheetName,
      sheetName,
      "dni",
      body.data.dni
    );
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        name: row ? row["nombre"] : undefined,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
