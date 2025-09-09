import { ConfigManger } from "../config/ConfigManger";
import { DriveManager } from "../DriveManager";
import { RequestLock } from "../RequestLock/RequestLock";
import { SessionManager } from "../SessionManager/sessionManager";
import { SheetManager } from "../SheetManager";
//import { sheetName, sheetName1, spreadsheetName } from "./getUser";
import { Body, Route } from "./Route";

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

    /* const hasSession = SessionManager.getSession(body.data.dni);
    if (!hasSession) {
      SessionManager.saveSession(body.data.dni);
    } */
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
