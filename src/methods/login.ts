import { ConfigManger } from "../config/ConfigManger";
import { RequestLock } from "../lib/RequestLock/RequestLock";
import { Body, Route } from "../lib/Router/Route";
import { SheetManager } from "../lib/SheetManager";

interface BodyData {
  dni: string;
  password: string;
}

export class RouteLogin extends Route {
  static override method(body: Body<BodyData>, requestId: string) {
    if (body.type !== "login") return null;
    const config = ConfigManger.getConfig();
    const spreadsheetName = config["usersSpreadsheet"];
    const usersSheet = config["usersSheet"];
    const passwordSheet = config["passwordSheet"];

    SheetManager.Spreadsheet.registerSpreadsheet(spreadsheetName);

    const row = SheetManager.Table.findByColumnValue(
      spreadsheetName,
      usersSheet,
      "dni",
      body.data.dni
    );

    const password = SheetManager.Row.getCell(
      spreadsheetName,
      passwordSheet,
      1,
      2
    );

    const isValid =
      password == body.data.password && row != undefined && row != null;

    if (!isValid) {
      RequestLock.setIsReady(true);
      return ContentService.createTextOutput(
        JSON.stringify({
          correct: false,
          alreadyLogged: false,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    RequestLock.setIsReady(true);
    return ContentService.createTextOutput(
      JSON.stringify({
        correct: true,
        alreadyLogged: false,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  static saveCache() {}
}
