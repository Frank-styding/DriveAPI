export interface Body<T = Record<string, any>> {
  type: string;
  timestamp: number;
  id: string;
  data: T;
}

export abstract class Route {
  static method(
    body: Body,
    requestId: string
  ): GoogleAppsScript.Content.TextOutput | null {
    return null;
  }
}
