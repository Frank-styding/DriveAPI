import { QueueManager, QueueItem } from "../QueueManager";
import { RequestLock } from "../RequestLock/RequestLock";
import { Utils } from "../utils/utils";
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
    // if (!QueueManager.operations.includes(body.type)) return null;
    try {
      RequestLock.setIsReady(false);

      //PropertiesService.getScriptProperties().setProperty("isReady", "false");
      if (!QueueManager.operations.includes(body.type)) {
        RequestLock.setIsReady(true);

        //  PropertiesService.getScriptProperties().setProperty("isReady", "true");
        return null;
        /*         return ContentService.createTextOutput(
          JSON.stringify({
            error: "Invalid request type",
            message: "Only 'insertRowMany' and 'insertRow' are supported",
            requestId: requestId,
          })
        ).setMimeType(ContentService.MimeType.JSON); */
      }

      // Process the request
      const id = Utilities.getUuid();
      if (Array.isArray(body.data)) {
        (body.data as QueueItem[]).forEach((item) => {
          const queueItem: QueueItem = {
            type: body.type,
            data: item,
            id: body.id || id,
            timestamp: new Date(item.timestamp || Date.now()).getTime(),
          };
          QueueManager.Queue.addToQueue(queueItem);
        });
      } else {
        const queueItem: QueueItem = {
          type: body.type,
          data: body.data,
          id: body.id || id,
          timestamp: new Date(body.timestamp || Date.now()).getTime(),
        };
        QueueManager.Queue.addToQueue(queueItem);
      }

      RequestLock.setIsReady(true);

      // Set ready state
      // PropertiesService.getScriptProperties().setProperty("isReady", "true");

      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: "Item added to queue",
          requestId: requestId,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    } finally {
      RequestLock.setIsReady(true);
      RequestLock.releaseLock(requestId);
    }
  }
}
