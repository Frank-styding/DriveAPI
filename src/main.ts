import { ConfigManger } from "./ConfigManger";
import { DriveManager } from "./DriveManger";
import { operations, ProcessQueue } from "./processQueue";
import { QueueManager } from "./QueueManager";
import { RequestLock } from "./RequestLock";
import { SheetManager } from "./SheetManager";
import { Utils } from "./utils";

function doPost(e) {
  const requestId = `req_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  try {
    const body = e.postData.contents;
    const json = JSON.parse(body);

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

      if (operations.includes(json.type)) {
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
        json.data.forEach((item) => {
          const queueItem = {
            type: json.type,
            data: item,
            id: `item_${Date.now()}`,
            timestamp: new Date(item.timestamp || Date.now()).getTime(),
          };
          QueueManager.addToQueue(queueItem);
        });
      } else {
        const queueItem = {
          type: json.type,
          data: json.data,
          id: `item_${Date.now()}`,
          timestamp: new Date(json.data.timestamp || Date.now()).getTime(),
        };
        QueueManager.addToQueue(queueItem);
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
        message: error.toString(),
        requestId: requestId,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function triggerFunc() {
  ProcessQueue.processQueue(ConfigManger.getConfig());
}

/* function testClearTrigger() {
  ConfigManger.setConfig({
    operation: "clearTriggers",
  });
}

function testInitTrigger() {
  ConfigManger.setConfig({
    time: 5,
    operation: "initProcessQueueTrigger",
  });
} */

function testConfig() {
  ConfigManger.setConfig({
    folderName: "data",
    headers: ["inicio", "horas", "Estado"],
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
            value: "Trabajando",
            background: "green",
          },
          {
            type: "notEqualTo",
            value: "Trabajando",
            background: "red",
          },
        ],
      },
    },
    rowFormulas: {
      fin: "=A2",
      horas: "=IF(OR(ISBLANK(A1); ISBLANK(A2)); 0; A2 - A1)",
    },
    formulasFormat: {
      horas_trabajo: {
        numberFormat: "[h]:mm:ss",
      },
      horas_almuerzo: {
        numberFormat: "[h]:mm:ss",
      },
    },
    formulas: {
      horas_trabajo: '=SUMIF(C2:C, "Trabajando", B2:B)',
      horas_almuerzo: '=SUMIF(C2:C, "Almuerzo", B2:B)',
    },
  });
  console.log(ConfigManger.getConfig());
}

function testAddToQueue() {
  QueueManager.clearQueue();
  const json = {
    type: "insertFormat_1",
    data: {
      data: {
        tableName: "jose",
        tableData: { capitan: "jose" },
        items: [
          { inicio: "9:00", Estado: "Trabajando" },
          { inicio: "10:00", Estado: "Materiales" },
          { inicio: "12:00", Estado: "Trabajando" },
          { inicio: "13:00", Estado: "Almuerzo" },
          { inicio: "15:00", Estado: "Trabajando" },
        ],
      },
      spreadsheetName: Utils.formatDate(new Date()),
      sheetName: Utils.formatDate(new Date()),
    },
    timestamp: "2023-10-01T12:00:00Z",
  };
  QueueManager.addToQueue({
    type: json.type,
    data: json.data,
    id: `item_${Date.now()}`,
    timestamp: new Date(json.timestamp || Date.now()).getTime(),
  });
  console.log(QueueManager.getQueue());
}

function testProcessQueue() {
  SheetManager.clearCache();
  DriveManager.clearCache();
}

// Utility function to clear locks manually (for testing/debugging)
function clearAllLocks() {
  PropertiesService.getScriptProperties().deleteProperty("request_lock");
  console.log("All locks cleared");
}

// Function to check current lock status
function checkLockStatus() {
  const lockData =
    PropertiesService.getScriptProperties().getProperty("request_lock");
  if (lockData) {
    const lockInfo = JSON.parse(lockData);
    const lockAge = Date.now() - lockInfo.timestamp;
    console.log(`Lock exists: ${lockInfo.requestId}, Age: ${lockAge}ms`);
  } else {
    console.log("No active lock");
  }
}

function test() {
  testConfig();
  testAddToQueue();
  testProcessQueue();
  triggerFunc();
}
