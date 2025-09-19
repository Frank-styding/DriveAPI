export class TriggerManager {
  private constructor() {}
  static createTrigger(time: number): GoogleAppsScript.Script.Trigger {
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
