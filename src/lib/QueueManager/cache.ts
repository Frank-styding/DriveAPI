import { CacheManager } from "../CacheManager";
import { QueueItem } from "./QueueItem";
const QUEUE_KEY = "QUEUE_KEY";
export class QueueCache {
  static QUEUE: QueueItem[];
  static saveCache(queue?: QueueItem[]) {
    CacheManager.saveCache<QueueItem[]>(QUEUE_KEY, queue || this.QUEUE, []);
  }

  static getCache() {
    if (this.QUEUE) return this.QUEUE;

    this.QUEUE = CacheManager.getCache<QueueItem[]>(QUEUE_KEY, []);
    return this.QUEUE;
  }
  static clearCache() {
    CacheManager.clearCache(QUEUE_KEY);
  }
}
