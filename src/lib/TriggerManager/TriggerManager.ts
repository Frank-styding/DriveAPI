export class TriggerManager {
  private constructor() {}
  static createTrigger(time: number): GoogleAppsScript.Script.Trigger | null {
    const triggers = ScriptApp.getProjectTriggers();
    const exists = triggers.some(
      (trigger) => trigger.getHandlerFunction() === "triggerFunc"
    );
    if (exists) {
      return null;
    }
    return ScriptApp.newTrigger("triggerFunc")
      .timeBased()
      .everyMinutes(time)
      .create();
  }

  static deleteAllTriggers(): void {
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach((trigger) => ScriptApp.deleteTrigger(trigger));
  }
}
