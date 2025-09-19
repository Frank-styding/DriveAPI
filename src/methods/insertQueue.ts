import { QueueItem, QueueManager } from "../lib/QueueManager";
import { RequestLock } from "../lib/RequestLock/RequestLock";
import { Body, Route } from "../lib/Router/Route";
import { operations } from "../processQueue";

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
    if (!operations.includes(body.type)) return null;
    try {
      RequestLock.setIsReady(false);
      if (QueueManager.Queue.hasId(body.id)) {
        RequestLock.setIsReady(true);
        RequestLock.releaseLock(requestId);
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
      RequestLock.releaseLock(requestId);
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
