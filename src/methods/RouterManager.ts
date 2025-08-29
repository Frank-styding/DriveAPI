import { RequestLock } from "../RequestLock/RequestLock";
import { Body, Route } from "./Route";

export class RouterManager {
  static executeRoute(body: Body, requestId: string, routes: (typeof Route)[]) {
    for (let i = 0; i < routes.length; i++) {
      const item = routes[i].method(body, requestId);
      if (item != null) {
        return item;
      }
    }
    return null;
  }
}
