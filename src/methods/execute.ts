import { ConfigManger } from "../config/ConfigManger";
import { Route, Body } from "../lib/Router/Route";

export class RouteExecute extends Route {
  static override method(
    body: Body
  ): GoogleAppsScript.Content.TextOutput | null {
    if (body.type !== "execute") return null;
    ConfigManger.processOperation(body.data);
    return ContentService.createTextOutput("Operation complete");
  }
}
