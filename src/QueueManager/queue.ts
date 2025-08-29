import { QueueCache } from "./cache";
import { QueueItem } from "./QueueItem";

const QUEUE_MEMORY_KEY = "QUEUE_MEMORY_IDS";
const MAX_IDS_IN_MEMORY = 500;
const MAX_ID_AGE_HOURS = 3;

interface StoredId {
  id: string;
  timestamp: number;
}

export class Queue {
  private constructor() {}

  private static dedupe(queue: QueueItem[]): QueueItem[] {
    const uniqueMap = new Map<string, QueueItem>();
    queue.forEach((item) => {
      uniqueMap.set(item.id, item);
    });
    return Array.from(uniqueMap.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }

  static addToQueue(item: QueueItem): void {
    // ✅ evita agregar duplicados
    if (this.hasId(item.id)) {
      return; // ya existe, no lo guardamos
    }

    if (!item.timestamp) {
      item.timestamp = new Date().getTime();
    }

    const queue = QueueCache.getCache();
    queue.push(item);

    const cleaned = this.dedupe(queue);
    QueueCache.saveCache(cleaned);

    this.registerId(item.id);
  }

  static addToQueueMany(items: QueueItem[]): void {
    const queue = QueueCache.getCache();

    items.forEach((item) => {
      if (this.hasId(item.id)) return; // ya existe

      if (!item.timestamp) {
        item.timestamp = new Date().getTime();
      }
      queue.push(item);
      this.registerId(item.id);
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
    queue = queue.filter((qItem) => qItem.timestamp !== timestamp);
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

  private static getStoredIds(): StoredId[] {
    const props = PropertiesService.getScriptProperties();
    const raw = props.getProperty(QUEUE_MEMORY_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private static saveStoredIds(storedIds: StoredId[]): void {
    const props = PropertiesService.getScriptProperties();
    props.setProperty(QUEUE_MEMORY_KEY, JSON.stringify(storedIds));
  }

  private static cleanExpiredIds(storedIds: StoredId[]): StoredId[] {
    const now = new Date().getTime();
    const maxAge = MAX_ID_AGE_HOURS * 60 * 60 * 1000;

    return storedIds.filter((stored) => {
      return now - stored.timestamp <= maxAge;
    });
  }

  private static limitIdsToMax(storedIds: StoredId[]): StoredId[] {
    if (storedIds.length <= MAX_IDS_IN_MEMORY) {
      return storedIds;
    }
    return storedIds
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_IDS_IN_MEMORY);
  }

  private static cleanupMemory(): StoredId[] {
    let storedIds = this.getStoredIds();
    storedIds = this.cleanExpiredIds(storedIds);
    storedIds = this.limitIdsToMax(storedIds);
    this.saveStoredIds(storedIds);
    return storedIds;
  }

  static registerId(id: string): void {
    let storedIds = this.cleanupMemory();
    const existingIndex = storedIds.findIndex((stored) => stored.id === id);
    if (existingIndex >= 0) {
      storedIds[existingIndex].timestamp = new Date().getTime();
    } else {
      const newStoredId: StoredId = {
        id: id,
        timestamp: new Date().getTime(),
      };
      storedIds.push(newStoredId);

      storedIds = this.limitIdsToMax(storedIds);
    }
    this.saveStoredIds(storedIds);
  }

  static hasId(id: string): boolean {
    const storedIds = this.cleanupMemory();

    return storedIds.some((stored) => stored.id === id);
  }
}
