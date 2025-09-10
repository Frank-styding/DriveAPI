import { QueueManager, QueueItem } from "../QueueManager";
import { RequestLock } from "../RequestLock/RequestLock";
import { Body, Route } from "./Route";

interface BodyData {
  spreadsheetName?: string | undefined;
  sheetName?: string | undefined;
  data: Record<string, any>;
}

export class RouteInsertToQueue extends Route {
  static override method(
    body: Body<BodyData>,
    requestId: string
  ): GoogleAppsScript.Content.TextOutput | null {
    if (!QueueManager.operations.includes(body.type)) return null;
    try {
      RequestLock.setIsReady(false);
      if (QueueManager.Queue.hasId(body.id)) {
        return ContentService.createTextOutput(
          JSON.stringify({
            success: true,
          })
        ).setMimeType(ContentService.MimeType.JSON);
      }
      const id = Utilities.getUuid();
      const queueItem: QueueItem = {
        type: body.type,
        data: body.data,
        id: body.id || id,
        timestamp: new Date(body.timestamp).getTime(),
      };
      QueueManager.Queue.addToQueue(queueItem);
      RequestLock.setIsReady(true);
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    } finally {
      RequestLock.setIsReady(true);
      RequestLock.releaseLock(requestId);
    }
  }
}
