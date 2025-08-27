const KEY = "SENT_ITEMS_REGISTRY";
const MAX_SIZE = 100;
export class ItemHistory {
  static markAsSent(id: string): void {
    const registry = this.getRegistry();
    // Si ya existe, lo removemos para actualizar su posición
    this.removeIfExists(registry, id);
    // Agregamos al inicio (los más recientes al principio)
    registry.unshift({
      id,
      timestamp: new Date().toISOString(),
    });
    // Mantenemos solo los últimos MAX_SIZE elementos
    if (registry.length > MAX_SIZE) {
      registry.splice(MAX_SIZE);
    }
    this.saveRegistry(registry);
  }

  static hasBeenSent(id: string): boolean {
    return this.getRegistry().some((item) => item.id === id);
  }

  private static getRegistry(): SentItem[] {
    const props = PropertiesService.getScriptProperties();
    const data = props.getProperty(KEY);
    return data ? JSON.parse(data) : [];
  }

  private static saveRegistry(registry: SentItem[]): void {
    const props = PropertiesService.getScriptProperties();
    props.setProperty(KEY, JSON.stringify(registry));
  }

  private static removeIfExists(registry: SentItem[], id: string): void {
    const index = registry.findIndex((item) => item.id === id);
    if (index > -1) {
      registry.splice(index, 1);
    }
  }
}

interface SentItem {
  id: string;
  timestamp: string;
}
