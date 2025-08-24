export interface QueueItem {
  data: {
    spreadsheetName?: string;
    sheetName?: string;
    data: Record<string, any>;
  };
  type: string;
  id: string;
  timestamp: number;
}
/**
 * QueueManager handles the queue of pending operations, allowing addition, removal, and retrieval of queue items.
 */
export class QueueManager {
  private constructor() {}
  static queue: QueueItem[];
  /**
   * Initializes the queue from cache if not already initialized.
   */
  static initialize(): void {
    if (this.queue != undefined) return;
    this.queue = [];
    this.getCache(); // Load existing queue from cache
  }
  /**
   * Adds a new item to the queue and sorts by timestamp.
   * @param item The queue item to add
   */
  static addToQueue(item: QueueItem): void {
    this.getCache(); // Load existing queue from cache
    if (!item.timestamp) {
      item.timestamp = new Date().getTime();
    }
    this.queue.push(item);
    this.queue.sort((a, b) => a.timestamp - b.timestamp);
    this.saveCache(); // Save updated queue to cache
  }
  /**
   * Adds multiple items to the queue and sorts by timestamp.
   * @param items Array of queue items to add
   */
  static addToQueueMany(items: QueueItem[]): void {
    this.getCache(); // Load existing queue from cache
    items.forEach((item) => {
      if (!item.timestamp) {
        item.timestamp = new Date().getTime();
      }
      this.queue.push(item);
    });
    this.queue.sort((a, b) => a.timestamp - b.timestamp);
    this.saveCache(); // Save updated queue to cache
  }
  /**
   * Retrieves the current queue, sorted by timestamp.
   * @returns Array of queue items
   */
  static getQueue(): QueueItem[] {
    this.getCache(); // Load existing queue from cache
    this.queue.sort((a, b) => a.timestamp - b.timestamp);
    return this.queue;
  }
  /**
   * Clears the queue and removes it from cache.
   */
  static clearQueue(): void {
    this.queue = [];
    this.saveCache(); // Clear cache
  }
  /**
   * Removes a queue item by its timestamp.
   * @param timestamp Timestamp of the item to remove
   */
  static removeFromQueue(timestamp: number): void {
    this.getCache(); // Load existing queue from cache
    const index = this.queue.findIndex(
      (qItem) => qItem.timestamp === timestamp
    );
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
    this.saveCache();
  }
  /**
   * Removes multiple queue items by their IDs.
   * @param ids Array of item IDs to remove
   */
  static removeManyFromQueue(ids: string[]): void {
    this.getCache(); // Load existing queue from cache
    this.queue = this.queue.filter((qItem) => !ids.includes(qItem.id));
    this.saveCache();
  }
  /**
   * Returns the number of items in the queue.
   * @returns Queue size
   */
  static getQueueSize(): number {
    this.getCache(); // Load existing queue from cache
    return this.queue.length;
  }
  /**
   * Retrieves all queue items of a specific type.
   * @param type The type to filter by
   * @returns Array of queue items of the given type
   */
  static getQueueItemByType(type: string): QueueItem[] {
    this.getCache(); // Load existing queue from cache
    this.queue.sort((a, b) => a.timestamp - b.timestamp);
    return this.queue.filter((item) => item.type === type);
  }
  /**
   * Saves the current queue to PropertiesService cache.
   */
  static saveCache(): void {
    this.initialize(); // Ensure the queue is initialized
    PropertiesService.getScriptProperties().setProperty(
      "queue",
      JSON.stringify(this.queue)
    );
  }
  /**
   * Loads the queue from PropertiesService cache.
   */
  static getCache(): void {
    this.initialize();
    const cache = PropertiesService.getScriptProperties().getProperty("queue");
    this.queue = cache ? JSON.parse(cache) : [];
  }
}
