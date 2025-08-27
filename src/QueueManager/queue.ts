import { QueueCache } from "./cache";
import { QueueItem } from "./QueueItem";

export class Queue {
  private constructor() {}

  private static dedupe(queue: QueueItem[]): QueueItem[] {
    // Usar Map para quedarnos con el último item por id
    const uniqueMap = new Map<string, QueueItem>();
    queue.forEach((item) => {
      uniqueMap.set(item.id, item);
    });

    // Volver a array y ordenar por timestamp
    return Array.from(uniqueMap.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }

  static addToQueue(item: QueueItem): void {
    const queue = QueueCache.getCache();
    if (!item.timestamp) {
      item.timestamp = new Date().getTime();
    }
    queue.push(item);

    const cleaned = this.dedupe(queue);
    QueueCache.saveCache(cleaned); // Guardar ya sin duplicados
  }

  static addToQueueMany(items: QueueItem[]): void {
    const queue = QueueCache.getCache();
    items.forEach((item) => {
      if (!item.timestamp) {
        item.timestamp = new Date().getTime();
      }
      queue.push(item);
    });

    const cleaned = this.dedupe(queue);
    QueueCache.saveCache(cleaned);
  }

  static getQueue(): QueueItem[] {
    const queue = QueueCache.getCache();
    return this.dedupe(queue);
  }

  static clearQueue(): void {
    QueueCache.clearCache();
  }

  static removeFromQueue(timestamp: number): void {
    let queue = QueueCache.getCache();
    const index = queue.findIndex((qItem) => qItem.timestamp === timestamp);
    if (index !== -1) {
      queue.splice(index, 1);
    }
    const cleaned = this.dedupe(queue);
    QueueCache.saveCache(cleaned);
  }

  static removeManyFromQueue(ids: string[]): void {
    let queue = QueueCache.getCache();
    queue = queue.filter((qItem) => !ids.includes(qItem.id));
    const cleaned = this.dedupe(queue);
    QueueCache.saveCache(cleaned);
  }

  static getQueueSize(): number {
    const queue = QueueCache.getCache();
    return this.dedupe(queue).length;
  }

  static getQueueItemByType(type: string): QueueItem[] {
    const queue = QueueCache.getCache();
    return this.dedupe(queue).filter((item) => item.type === type);
  }
}
