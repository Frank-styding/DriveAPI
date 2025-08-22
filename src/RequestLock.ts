/**
 * RequestLock provides a locking mechanism using PropertiesService to ensure only one critical request is processed at a time.
 */
export class RequestLock {
  private static LOCK_KEY: string;
  private static LOCK_TIMEOUT: number; // 30 seconds timeout
  private static CHECK_INTERVAL: number; // Check every 100ms
  /**
   * Initializes lock configuration if not already set.
   */
  static initialize() {
    if (this.LOCK_KEY) return;
    this.LOCK_KEY = "request_lock";
    this.LOCK_TIMEOUT = 30000; // 30 seconds
    this.CHECK_INTERVAL = 100; // 100 milliseconds
  }

  /**
   * Attempts to acquire a lock for the given requestId. Waits up to the timeout.
   * @param requestId Unique request identifier
   * @returns True if lock acquired, false otherwise
   */
  static async acquireLock(requestId: string): Promise<boolean> {
    this.initialize();
    const startTime = Date.now();

    while (Date.now() - startTime < this.LOCK_TIMEOUT) {
      const lockData = PropertiesService.getScriptProperties().getProperty(
        this.LOCK_KEY
      );

      if (!lockData) {
        // No lock exists, try to acquire it
        const lockInfo = {
          requestId: requestId,
          timestamp: Date.now(),
        };

        PropertiesService.getScriptProperties().setProperty(
          this.LOCK_KEY,
          JSON.stringify(lockInfo)
        );

        // Verify we got the lock (double-check for race conditions)
        Utilities.sleep(10);
        const verifyLock = PropertiesService.getScriptProperties().getProperty(
          this.LOCK_KEY
        );
        const verifyLockInfo = verifyLock ? JSON.parse(verifyLock) : null;

        if (verifyLockInfo && verifyLockInfo.requestId === requestId) {
          return true;
        }
      } else {
        // Lock exists, check if it's expired
        const lockInfo = JSON.parse(lockData);
        const lockAge = Date.now() - lockInfo.timestamp;

        if (lockAge > this.LOCK_TIMEOUT) {
          // Lock is expired, try to acquire it
          PropertiesService.getScriptProperties().deleteProperty(this.LOCK_KEY);
          continue;
        }
      }

      // Wait before retrying
      Utilities.sleep(this.CHECK_INTERVAL);
    }

    return false; // Failed to acquire lock within timeout
  }

  /**
   * Releases the lock if owned by the given requestId.
   * @param requestId Unique request identifier
   */
  static releaseLock(requestId: string): void {
    this.initialize();
    const lockData = PropertiesService.getScriptProperties().getProperty(
      this.LOCK_KEY
    );

    if (lockData) {
      const lockInfo = JSON.parse(lockData);

      // Only release if we own the lock
      if (lockInfo.requestId === requestId) {
        PropertiesService.getScriptProperties().deleteProperty(this.LOCK_KEY);
      }
    }
  }

  /**
   * Clears expired locks from PropertiesService.
   */
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
