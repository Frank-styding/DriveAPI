import { ConfigManger } from "../config/ConfigManger";
/* import { SheetManager } from "../SheetManager"; */
import { Body, Route } from "../lib/Router/Route";

export class RouteAppConfig extends Route {
  static override method(body: Body, requestId: string) {
    if (body.type !== "appConfig") return null;
    const config = ConfigManger.getConfig()["appConfig"];
    return ContentService.createTextOutput(
      JSON.stringify({
        config,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
