import { BrowserHelper } from './browser.helper';

export class CssHelper {

  public static getCssVariableValue(variableName: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName);
  }

  public static getCssVariableValueNumeric(variableName: string): number {
    const value = CssHelper.getCssVariableValue(variableName) || '';
    if (value.endsWith('vw')) {
      return +(value.replace('vw', '')) * BrowserHelper.getScreenWith() / 100;
    }
    if (value.endsWith('vh')) {
      return +(value.replace('vh', '')) * BrowserHelper.getScreenHeight() / 100;
    }
    // assume pixels, too difficult to compute em/rem so a different approach is needed for those
    return +(value.replace(/[^\d.]/g, ''));
  }

  public static setCssVariableValue(variableName: string, value: string, el?: HTMLElement | null) {
    (el || document.documentElement).style.setProperty(variableName, value);
  }

}
