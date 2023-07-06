export class DebounceHelper {

  private static timers: { [key: string]: number } = {};

  public static debounce(key: string, callback: () => void, timeout?: number) {
    if (this.timers[key]) {
      window.clearTimeout(this.timers[key]);
    }
    this.timers[key] = window.setTimeout(() => {
      callback();
      delete this.timers[key];
    }, timeout || 250);
  }

}
