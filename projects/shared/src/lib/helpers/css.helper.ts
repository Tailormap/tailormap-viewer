import { BrowserHelper } from './browser.helper';
import { fromEvent, race } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export class CssHelper {

  public static MAX_SCREEN_HEIGHT = 'calc(var(--vh) * 100)';

  private static isListeningToResize = false;

  public static updateCssViewportUnits() {
    if (!CssHelper.isListeningToResize) {
      CssHelper.isListeningToResize = true;
      race([
        fromEvent(window, 'resize'),
        fromEvent(window, 'orientationchange'),
      ]).pipe(debounceTime(150)).subscribe(() => CssHelper.updateCssViewportUnits());
    }
    const vh = BrowserHelper.getScreenHeight() * 0.01;
    const vw = BrowserHelper.getScreenWith() * 0.01;
    CssHelper.setCssVariableValue('--vh', `${vh.toFixed(2)}px`);
    CssHelper.setCssVariableValue('--vw', `${vw.toFixed(2)}px`);
  }

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

CssHelper.updateCssViewportUnits();
