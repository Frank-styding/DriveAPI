import { ConfigManger } from "./config/ConfigManger";
import { DriveManager } from "./DriveManager";
import {
  RouteExecute,
  RouteInsertToQueue,
  RouteIsReady,
  RouterManager,
  RouteSetConfig,
} from "./methods";
import { RouteGetUser } from "./methods/getUser";
import { RouteLogin } from "./methods/login";
import { Body } from "./methods/Route";
import { QueueManager } from "./QueueManager";
import { RequestLock } from "./RequestLock/RequestLock";
import { SheetManager } from "./SheetManager";
import { Format1 } from "./templates/Format1";
import { TriggerManager } from "./TriggerManager/TriggerManager";

function doPost(e: any) {
  init();
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
  QueueManager.ProcessQueue.processQueue(ConfigManger.getConfig());
}

function init() {
  if (Object.keys(ConfigManger.getConfig()).length == 0) {
    ConfigManger.setProperty({
      folderName: "data",
      headers: ["inicio", "horas", "estado"],
      headerFormats: {
        1: {
          numberFormat: "[h]:mm:ss",
        },
        2: {
          conditionalRules: [
            {
              type: "textIsEmpty",
              background: "white",
            },
            {
              type: "textEqualTo",
              value: "trabajando",
              background: "#41B451",
            },
            {
              type: "textEqualTo",
              value: "fin jornada",
              background: "#389FBE",
            },
            {
              type: "notEqualTo",
              value: "trabajando",
              background: "#AA3636",
            },
          ],
        },
      },
      rowFormulas: {
        fin: "=A2",
        horas: "=IF(OR(ISBLANK(A1); ISBLANK(A2)); 0; A2 - A1)",
      },
      formulasFormat: {
        trabajo: {
          numberFormat: "[h]:mm:ss",
        },
        falta_matriales: {
          numberFormat: "[h]:mm:ss",
        },
        translado_interno: {
          numberFormat: "[h]:mm:ss",
        },
        problemas_climaticos: {
          numberFormat: "[h]:mm:ss",
        },
        almuerzo: {
          numberFormat: "[h]:mm:ss",
        },
        charlas: {
          numberFormat: "[h]:mm:ss",
        },
        pausas: {
          numberFormat: "[h]:mm:ss",
        },
        materia_prima: {
          numberFormat: "[h]:mm:ss",
        },
        repaso: {
          numberFormat: "[h]:mm:ss",
        },
        total_paros: {
          numberFormat: "[h]:mm:ss",
        },
      },
      formulas: {
        trabajo: '=SUMIF(C2:C, "trabajando", B2:B)',
        falta_matriales: '=SUMIF(C2:C, "materiales", B2:B)',
        translado_interno: '=SUMIF(C2:C, "traslado interno", B2:B)',
        problemas_climaticos: '=SUMIF(C2:C, "problemas climaticos", B2:B)',
        almuerzo: '=SUMIF(C2:C, "almuerzo", B2:B)',
        charlas: '=SUMIF(C2:C, "charla", B2:B)',
        pausas: '=SUMIF(C2:C, "pausa", B2:B)',
        materia_prima: '=SUMIF(C2:C, "materia prima", B2:B)',
        repaso: '=SUMIF(C2:C, "repaso", B2:B)',
        total_paros: "=SUM(E3:E11)",
      },
    });
    ConfigManger.processOperation({
      time: 1,
      operation: "initProcessQueueTrigger",
    });
  }
}

function clearCache() {
  DriveManager.cache.clearCache();
  SheetManager.cache.clearCache();
  QueueManager.cache.clearCache();
  QueueManager.Queue.clearQueue();
  TriggerManager.deleteAllTriggers();
  ConfigManger.clearConfig();
  Format1.restoreFormta1Memory();
  RequestLock.clearCache();
  console.log(RequestLock.getIsReady());
}
/* 
function doPost(e: any) {
  init();
  const requestId = `req_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  try {
    const body = e.postData.contents;
    const json = JSON.parse(body);
    const id = json.id || generateUUID();

    // Handle config requests without locking (they're usually fast)
    if (json.type == "config") {
      return ConfigManger.setConfig(json.data);
    }

    // Handle isReady requests without locking
    if (json.type == "isReady") {
      // Clear any expired locks first
      RequestLock.clearExpiredLocks();

      const isReady =
        PropertiesService.getScriptProperties().getProperty("isReady");
      const lockExists =
        PropertiesService.getScriptProperties().getProperty("request_lock");

      // Return false if there's an active lock or if explicitly set to false
      return ContentService.createTextOutput(
        !lockExists && (isReady === null || isReady === "true")
          ? "true"
          : "false"
      );
    }
    // For all other requests, use locking mechanism
    if (!RequestLock.acquireLock(requestId)) {
      return ContentService.createTextOutput(
        JSON.stringify({
          error: "Request timeout",
          message: "Could not acquire lock within timeout period",
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    try {
      // Set processing state
      PropertiesService.getScriptProperties().setProperty("isReady", "false");

      // Process the request

      if (!QueueManager.operations.includes(json.type)) {
        PropertiesService.getScriptProperties().setProperty("isReady", "true");
        return ContentService.createTextOutput(
          JSON.stringify({
            error: "Invalid request type",
            message: "Only 'insertRowMany' and 'insertRow' are supported",
            requestId: requestId,
          })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      // Process the request

      if (Array.isArray(json.data)) {
        (json.data as QueueItem[]).forEach((item) => {
          const queueItem: QueueItem = {
            type: json.type,
            data: item,
            id: generateUUID(),
            timestamp: new Date(item.timestamp || Date.now()).getTime(),
          };
          QueueManager.Queue.addToQueue(queueItem);
        });
      } else {
        const queueItem = {
          type: json.type,
          data: json.data,
          id: generateUUID(),
          timestamp: new Date(json.data.timestamp || Date.now()).getTime(),
        };
        QueueManager.Queue.addToQueue(queueItem);
      }

      // Set ready state
      PropertiesService.getScriptProperties().setProperty("isReady", "true");

      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: "Item added to queue",
          requestId: requestId,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    } finally {
      // Always release the lock
      RequestLock.releaseLock(requestId);
    }
  } catch (error) {
    // Release lock in case of error
    RequestLock.releaseLock(requestId);

    // Set ready state even if there was an error
    PropertiesService.getScriptProperties().setProperty("isReady", "true");

    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Internal error",
        message: (error as string).toString(),
        requestId: requestId,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
} */
