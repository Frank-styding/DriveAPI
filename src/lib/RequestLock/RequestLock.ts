export class RequestLock {
  private static LOCK_KEY: string;
  private static LOCK_TIMEOUT: number;
  private static CHECK_INTERVAL: number;

  static initialize() {
    if (this.LOCK_KEY) return;
    this.LOCK_KEY = "request_lock";
    this.LOCK_TIMEOUT = 30000;
    this.CHECK_INTERVAL = 300;
  }

  static acquireLock(requestId: string): boolean {
    this.initialize();
    const startTime = Date.now();

    while (Date.now() - startTime < this.LOCK_TIMEOUT) {
      const lockData = PropertiesService.getScriptProperties().getProperty(
        this.LOCK_KEY
      );

      if (!lockData) {
        const lockInfo = {
          requestId: requestId,
          timestamp: Date.now(),
        };

        PropertiesService.getScriptProperties().setProperty(
          this.LOCK_KEY,
          JSON.stringify(lockInfo)
        );

        Utilities.sleep(100);
        const verifyLock = PropertiesService.getScriptProperties().getProperty(
          this.LOCK_KEY
        );
        const verifyLockInfo = verifyLock ? JSON.parse(verifyLock) : null;

        if (verifyLockInfo && verifyLockInfo.requestId === requestId) {
          return true;
        }
      } else {
        const lockInfo = JSON.parse(lockData);
        const lockAge = Date.now() - lockInfo.timestamp;

        if (lockAge > this.LOCK_TIMEOUT) {
          PropertiesService.getScriptProperties().deleteProperty(this.LOCK_KEY);
          continue;
        }
      }

      Utilities.sleep(this.CHECK_INTERVAL);
    }

    return false;
  }
  /*   static setIsReady(isReady: boolean) {
    PropertiesService.getScriptProperties().setProperty(
      "isReady",
      isReady ? "true" : "false"
    );
  } */
  /*   static getIsReady() {
    const isReady =
      PropertiesService.getScriptProperties().getProperty("isReady");
    const lockExists =
      PropertiesService.getScriptProperties().getProperty("request_lock");
    return !lockExists && (isReady === null || isReady === "true");
  } */

  static releaseLock(requestId: string): void {
    this.initialize();
    const lockData = PropertiesService.getScriptProperties().getProperty(
      this.LOCK_KEY
    );

    if (lockData) {
      const lockInfo = JSON.parse(lockData);

      if (lockInfo.requestId === requestId) {
        PropertiesService.getScriptProperties().deleteProperty(this.LOCK_KEY);
      }
    }
  }
  static clearCache() {
    this.initialize();
    PropertiesService.getScriptProperties().deleteProperty(this.LOCK_KEY);
    // PropertiesService.getScriptProperties().deleteProperty("isReady");
  }

  static clearExpiredLocks(): void {
    this.initialize();
    const lockData = PropertiesService.getScriptProperties().getProperty(
      this.LOCK_KEY
    );

    if (lockData) {
      const lockInfo = JSON.parse(lockData);
      const lockAge = Date.now() - lockInfo.timestamp;

      if (lockAge > this.LOCK_TIMEOUT) {
        PropertiesService.getScriptProperties().deleteProperty(this.LOCK_KEY);
      }
    }
  }
}
