const KEY = "processed_requests";
const EXPIRATION_MS = 1000 * 60 * 60; // 1 hora
const MAX_IDS = 500;
export class RequestHistory {
  static addProcessedId(id: string): void {
    const store = PropertiesService.getScriptProperties();
    let history = store.getProperty(KEY);
    let records: { id: string; timestamp: number }[] = history
      ? JSON.parse(history)
      : [];

    records.push({ id, timestamp: Date.now() });

    // limpiar expirados
    records = records.filter((r) => Date.now() - r.timestamp < EXPIRATION_MS);

    // recortar a los últimos N
    if (records.length > MAX_IDS) {
      records = records.slice(-MAX_IDS);
    }

    store.setProperty(KEY, JSON.stringify(records));
  }

  static isProcessed(id: string): boolean {
    const store = PropertiesService.getScriptProperties();
    let history = store.getProperty(KEY);
    let records: { id: string; timestamp: number }[] = history
      ? JSON.parse(history)
      : [];

    // limpiar expirados
    const fresh = records.filter(
      (r) => Date.now() - r.timestamp < EXPIRATION_MS
    );

    // si hubo expirados, reescribir storage
    if (fresh.length !== records.length) {
      store.setProperty(KEY, JSON.stringify(fresh));
    }

    return fresh.some((r) => r.id === id);
  }
}
