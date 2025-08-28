import { Queue } from "../QueueManager/queue";
import { Body, Route } from "./Route";

export class RouteDeleteRequest extends Route {
  static override method(
    body: Body
  ): GoogleAppsScript.Content.TextOutput | null {
    if (body.type !== "deleteRequest") return null;
    const requestId = body.data["requestId"];
    Queue.removeId(requestId);
    return ContentService.createTextOutput("Queue deleted");
  }
}
