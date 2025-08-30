import { RequestLock } from "../RequestLock/RequestLock";
import { SheetManager } from "../SheetManager";
import { sheetName, sheetName1, spreadsheetName } from "./getUser";
import { Body, Route } from "./Route";

interface BodyData {
  dni: string;
  password: string;
}

export class RouteLogin extends Route {
  static override method(body: Body<BodyData>, requestId: string) {
    if (body.type !== "login") return null;
    SheetManager.Spreadsheet.registerSpreadsheet(spreadsheetName);
    const row = SheetManager.Table.findByColumnValue(
      spreadsheetName,
      sheetName,
      "dni",
      body.data.dni
    );
    const password = SheetManager.Row.getCell(
      spreadsheetName,
      sheetName1,
      1,
      2
    );
    RequestLock.setIsReady(true);
    return ContentService.createTextOutput(
      JSON.stringify({
        correct:
          password == body.data.password && row != undefined && row != null,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
