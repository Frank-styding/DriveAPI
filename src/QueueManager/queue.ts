import { QueueCache } from "./cache";
import { QueueItem } from "./QueueItem";

export class Queue {
  private constructor() {}
  static addToQueue(item: QueueItem): void {
    const queue = QueueCache.getCache();
    if (!item.timestamp) {
      item.timestamp = new Date().getTime();
    }
    queue.push(item);
    queue.sort((a, b) => a.timestamp - b.timestamp);
    QueueCache.saveCache(); // Save updated queue to cache
  }

  static addToQueueMany(items: QueueItem[]): void {
    const queue = QueueCache.getCache(); // Load existing queue from cache
    items.forEach((item) => {
      if (!item.timestamp) {
        item.timestamp = new Date().getTime();
      }
      queue.push(item);
    });
    queue.sort((a, b) => a.timestamp - b.timestamp);
    QueueCache.saveCache(); // Save updated queue to cache
  }

  static getQueue(): QueueItem[] {
    const queue = QueueCache.getCache(); // Load existing queue from cache
    queue.sort((a, b) => a.timestamp - b.timestamp);
    return queue;
  }

  static clearQueue(): void {
    QueueCache.clearCache();
  }

  static removeFromQueue(timestamp: number): void {
    const queue = QueueCache.getCache(); // Load existing queue from cache
    const index = queue.findIndex((qItem) => qItem.timestamp === timestamp);
    if (index !== -1) {
      queue.splice(index, 1);
    }
    QueueCache.saveCache();
  }

  static removeManyFromQueue(ids: string[]): void {
    let queue = QueueCache.getCache(); // Load existing queue from cache
    queue = queue.filter((qItem) => !ids.includes(qItem.id));
    QueueCache.saveCache(queue);
  }

  static getQueueSize(): number {
    const queue = QueueCache.getCache(); // Load existing queue from cache
    return queue.length;
  }

  static getQueueItemByType(type: string): QueueItem[] {
    const queue = QueueCache.getCache(); // Load existing queue from cache
    queue.sort((a, b) => a.timestamp - b.timestamp);
    return queue.filter((item) => item.type === type);
  }
}
