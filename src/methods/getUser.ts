import { ConfigManger } from "../config/ConfigManger";
import { RequestLock } from "../RequestLock/RequestLock";
import { SheetManager } from "../SheetManager";
import { Body, Route } from "./Route";

interface BodyData {
  dni: string;
}

/* export const spreadsheetName = "capitanes_data";
export const sheetName = "Capitanes";
export const sheetName1 = "Contraseña"; */
export class RouteGetUser extends Route {
  static override method(body: Body<BodyData>, requestId: string) {
    if (body.type !== "getUser") return null;
    const config = ConfigManger.getConfig();

    const spreadsheetName = config["usersSpreadsheet"];
    const usersSheet = config["usersSheet"];
    const passwordSheet = config["passwordSheet"];

    if (!SheetManager.Spreadsheet.registerSpreadsheet(spreadsheetName)) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const row = SheetManager.Table.findByColumnValue(
      spreadsheetName,
      usersSheet,
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
