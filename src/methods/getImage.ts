import { ConfigManger } from "../config/ConfigManger";
import { DriveManager } from "../lib/DriveManager";
import { Body, Route } from "../lib/Router/Route";

export class RouteGetImage extends Route {
  static override method(body: Body, requestId: string) {
    if (body.type !== "getImage") return null;
    const config = ConfigManger.getConfig();
    const imageData = DriveManager.File.getImageData(
      `${body.data.dni}.png`,
      config["imagesFolder"]
    );
    return ContentService.createTextOutput(
      JSON.stringify({
        image: imageData,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
