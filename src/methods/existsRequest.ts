import { Queue } from "../QueueManager/queue";
import { Body, Route } from "./Route";

export class RouteExistsRequest extends Route {
  static override method(
    body: Body
  ): GoogleAppsScript.Content.TextOutput | null {
    if (body.type !== "existsRequest") return null;
    const requestId = body.data["requestId"];
    return ContentService.createTextOutput(
      JSON.stringify({
        exists: Queue.hasId(requestId),
      })
    );
  }
}
