import { ConfigManger } from "../config/ConfigManger";
import { Body, Route } from "../lib/Router/Route";
import { SheetManager } from "../lib/SheetManager";

interface BodyData {
  dni: string;
}
export class RouteGetUser extends Route {
  static override method(body: Body<BodyData>, requestId: string) {
    if (body.type !== "getUser") return null;
    const config = ConfigManger.getConfig();
    const spreadsheetName = config["usersSpreadsheet"];
    const usersSheet = config["usersSheet"];
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
