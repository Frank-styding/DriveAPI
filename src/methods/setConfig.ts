import { ConfigManger } from "../config/ConfigManger";
import { Body, Route } from "./Route";

export class RouteSetConfig extends Route {
  static override method(body: Body) {
    if (body.type !== "setConfig") return null;
    ConfigManger.setProperty(body.data);
    return ContentService.createTextOutput("Configuration updated");
  }
}
