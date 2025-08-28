import { RequestLock } from "../RequestLock/RequestLock";
import { Body, Route } from "./Route";

export class RouteIsReady extends Route {
  static override method(
    body: Body
  ): GoogleAppsScript.Content.TextOutput | null {
    if (body.type !== "isReady") return null;
    RequestLock.clearExpiredLocks();
    return ContentService.createTextOutput(
      JSON.stringify({ isReady: RequestLock.getIsReady() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
