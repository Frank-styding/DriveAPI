import { QueueCache } from "./cache";
import { QueueItem } from "./QueueItem";

const QUEUE_MEMORY_KEY = "QUEUE_MEMORY_IDS";

export class Queue {
  private constructor() {}

  // -------------------- MÉTODOS EXISTENTES --------------------

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

    this.registerId(item.id); // registrar en memoria
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
    this.clearMemory(); // limpiar también la memoria de IDs
  }

  static removeFromQueue(timestamp: number): void {
    let queue = QueueCache.getCache();
    const item = queue.find((qItem) => qItem.timestamp === timestamp);
    if (item) {
      this.removeId(item.id); // eliminar de memoria
    }

    queue = queue.filter((qItem) => qItem.timestamp !== timestamp);
    const cleaned = this.dedupe(queue);
    QueueCache.saveCache(cleaned);
  }

  static removeManyFromQueue(ids: string[]): void {
    let queue = QueueCache.getCache();

    queue = queue.filter((qItem) => {
      if (ids.includes(qItem.id)) {
        this.removeId(qItem.id); // eliminar de memoria
        return false;
      }
      return true;
    });

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

  // -------------------- NUEVOS MÉTODOS DE MEMORIA --------------------

  private static getIds(): Set<string> {
    const props = PropertiesService.getScriptProperties();
    const raw = props.getProperty(QUEUE_MEMORY_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  }

  private static saveIds(ids: Set<string>): void {
    const props = PropertiesService.getScriptProperties();
    props.setProperty(QUEUE_MEMORY_KEY, JSON.stringify([...ids]));
  }

  static registerId(id: string): void {
    const ids = this.getIds();
    ids.add(id);
    this.saveIds(ids);
  }

  static hasId(id: string): boolean {
    const ids = this.getIds();
    return ids.has(id);
  }

  static removeId(id: string): void {
    const ids = this.getIds();
    ids.delete(id);
    this.saveIds(ids);
  }

  static clearMemory(): void {
    const props = PropertiesService.getScriptProperties();
    props.deleteProperty(QUEUE_MEMORY_KEY);
  }

  static getAllIds(): string[] {
    return [...this.getIds()];
  }
}
