import { CacheManager } from "../CacheManager";

const SESSION_CACHE_KEY = "USER_SESSIONS";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

export class SessionManager {
  static saveSession(dni: string) {
    const sessions = CacheManager.getCache<
      Record<string, { dni: string; expiresAt: number }>
    >(SESSION_CACHE_KEY, {});
    const now = Date.now();
    sessions[dni] = {
      dni,
      expiresAt: now + SESSION_DURATION_MS,
    };
    CacheManager.saveCache(SESSION_CACHE_KEY, sessions, {});
  }
  static clearCache() {
    CacheManager.clearCache(SESSION_CACHE_KEY);
  }

  static getSession(dni: string): boolean {
    const sessions = CacheManager.getCache<
      Record<string, { dni: string; expiresAt: number }>
    >(SESSION_CACHE_KEY, {});
    const session = sessions[dni];
    if (!session) return false;

    // validar expiración
    if (Date.now() > session.expiresAt) {
      delete sessions[dni];
      CacheManager.saveCache(SESSION_CACHE_KEY, sessions, {});
      return false;
    }
    return true;
  }

  static clearExpiredSessions() {
    const sessions = CacheManager.getCache<
      Record<string, { dni: string; expiresAt: number }>
    >(SESSION_CACHE_KEY, {});
    const now = Date.now();
    let changed = false;

    Object.keys(sessions).forEach((dni) => {
      if (sessions[dni].expiresAt < now) {
        delete sessions[dni];
        changed = true;
      }
    });

    if (changed) {
      CacheManager.saveCache(SESSION_CACHE_KEY, sessions, {});
    }
  }
}
