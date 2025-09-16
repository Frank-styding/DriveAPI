import { CacheManager } from "./CacheManager";
import { config } from "./config";
import { ConfigManger } from "./config/ConfigManger";
import { DriveManager } from "./DriveManager";
import {
  RouteExecute,
  RouteInsertToQueue,
  RouteIsReady,
  RouterManager,
  RouteSetConfig,
} from "./methods";
import { RouteAppConfig } from "./methods/getAppConfig";
import { RouteGetImage } from "./methods/getImage";
import { RouteGetUser } from "./methods/getUser";
import { RouteLogin } from "./methods/login";
import { Body } from "./methods/Route";
import { QueueManager } from "./QueueManager";
import { Queue } from "./QueueManager/queue";
import { RequestLock } from "./RequestLock/RequestLock";
import { SessionManager } from "./SessionManager/sessionManager";
import { SheetManager } from "./SheetManager";
import { FormulaProcessor } from "./SheetManager/formula";
import { Format1 } from "./templates/Format1";
import { TriggerManager } from "./TriggerManager/TriggerManager";

function doPost(e: any) {
  if (Object.keys(ConfigManger.getConfig()).length == 0) init();
  const requestId = `req_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  try {
    const body = e.postData.contents;
    const bodyJson = JSON.parse(body) as Body;

    const unlockData = RouterManager.executeRoute(bodyJson, requestId, [
      RouteIsReady,
      RouteGetUser,
      RouteLogin,
      RouteGetImage,
      RouteAppConfig,
    ]);

    if (unlockData) {
      return unlockData;
    }

    if (!RequestLock.acquireLock(requestId)) {
      return ContentService.createTextOutput(
        JSON.stringify({
          error: "Request timeout",
          message: "Could not acquire lock within timeout period",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const data = RouterManager.executeRoute(bodyJson, requestId, [
      RouteExecute,
      RouteSetConfig,
      RouteInsertToQueue,
    ]);

    if (data) {
      RequestLock.releaseLock(requestId);
      return data;
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Invalid request type",
        requestId: requestId,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    RequestLock.releaseLock(requestId);
    RequestLock.setIsReady(true);
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Internal error",
        message: (error as string).toString(),
        requestId: requestId,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function triggerFunc() {
  SessionManager.clearExpiredSessions();
  QueueManager.ProcessQueue.processQueue(ConfigManger.getConfig());
}

function init() {
  ConfigManger.setProperty(config);

  ConfigManger.processOperation({
    time: 1,
    operation: "initProcessQueueTrigger",
  });
}

function clearCache() {
  DriveManager.cache.clearCache();
  SheetManager.cache.clearCache();
  QueueManager.cache.clearCache();
  QueueManager.Queue.clearQueue();
  Queue.deleteIds();
  TriggerManager.deleteAllTriggers();
  ConfigManger.clearConfig();
  Format1.restoreFormta1Memory();
  RequestLock.clearCache();
  SessionManager.clearCache();
  CacheManager.clearAllCache();
}

function test() {
  const formula = '=SUMIF(D2:D, "pausa activa", B2:B)';
  const result = FormulaProcessor.processFormula(7, 2, formula); // startCol=7 => columna G, startRow=2
  Logger.log(result);
}
