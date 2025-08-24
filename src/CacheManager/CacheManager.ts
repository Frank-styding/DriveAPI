const CACHE_KEY = "CACHE_KEY";
export class CacheManager {
  private constructor() {}
  static CACHE_KEYS: string[];
  static CACHE_DATA: Record<string, any>;

  static saveCache<T>(key: string, data: T | undefined, defaulvalue: T) {
    if (!data) data = defaulvalue;
    PropertiesService.getScriptProperties().setProperty(
      key,
      JSON.stringify(data)
    );
    this.CACHE_DATA[key] = data;
    this.addKey(key);
  }
  static getCache<T>(key: string, defaultValue: T = {} as T): T {
    if (!this.CACHE_DATA) {
      this.CACHE_DATA = {};
    }
    if (this.CACHE_DATA[key]) return this.CACHE_DATA[key];
    const valueStr = PropertiesService.getScriptProperties().getProperty(key);
    if (!valueStr) return defaultValue;
    const value = JSON.parse(valueStr);
    this.CACHE_DATA[key] = value;
    return value;
  }

  static clearCache(key: string) {
    this.CACHE_DATA = {};
    this.getKeys();
    this.CACHE_KEYS = this.CACHE_KEYS.filter((item) => item != key);
    this.saveKeys();
    PropertiesService.getScriptProperties().deleteProperty(key);
  }

  static clearAllCache() {
    this.getKeys();
    if (!this.CACHE_KEYS) return;
    this.CACHE_KEYS.forEach((item) => {
      PropertiesService.getScriptProperties().deleteProperty(item);
    });
    PropertiesService.getScriptProperties().deleteProperty(CACHE_KEY);
  }

  private static getKeys(): void {
    if (this.CACHE_KEYS != undefined) return;
    const valueStr =
      PropertiesService.getScriptProperties().getProperty(CACHE_KEY);
    if (!valueStr) {
      this.CACHE_KEYS = [];
      return;
    }
    const value = JSON.parse(valueStr) as string[];
    this.CACHE_KEYS = value;
  }

  private static saveKeys() {
    PropertiesService.getScriptProperties().setProperty(
      CACHE_KEY,
      JSON.stringify(this.CACHE_KEYS)
    );
  }

  private static addKey(key: string) {
    this.getKeys();
    if (!this.CACHE_KEYS) return;
    if (!this.CACHE_KEYS.includes(key)) {
      this.CACHE_KEYS.push(key);
    }
    this.saveKeys();
  }
}
