/**
 * TriggerManager provides static methods to manage time-based triggers in Google Apps Script.
 */
export class TriggerManager {
  private constructor() {}

  /**
   * Creates a new time-based trigger for the function 'triggerFunc'.
   * @param time Interval in minutes
   * @returns The created trigger object
   */
  static createTrigger(time: number): GoogleAppsScript.Script.Trigger {
    return ScriptApp.newTrigger("triggerFunc")
      .timeBased()
      .everyMinutes(time)
      .create();
  }

  /**
   * Deletes all triggers in the current Apps Script project.
   */
  static deleteAllTriggers(): void {
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach((trigger) => ScriptApp.deleteTrigger(trigger));
  }
}
