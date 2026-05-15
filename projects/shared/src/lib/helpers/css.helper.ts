import { BrowserHelper } from './browser.helper';
import { fromEvent, race } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export class CssHelper {

  public static MAX_SCREEN_HEIGHT = 'calc(var(--vh) * 100)';

  private static isListeningToResize = false;

  private static cachedVariableValues = new Map<string, string>();

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

  public static getCssVariableValue(variableName: string, el?: HTMLElement | null): string {
    const cachedValue = !el
      ? CssHelper.cachedVariableValues.get(variableName)
      : null;
    if (cachedValue) {
      return cachedValue;
    }
    const propertyValue = getComputedStyle(el || document.documentElement).getPropertyValue(variableName);
    if (!el) {
      CssHelper.cachedVariableValues.set(variableName, propertyValue);
    }
    return propertyValue;
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
    if (!el) {
      CssHelper.cachedVariableValues.set(variableName, value);
    }
  }

  public static getScopedCss(css: string, scope: string): string {
    return css.replace(/([^{}]+)\s*{([^}]*)}/g, (match, selector, rules) => {
      const trimmedSelector = selector.trim();
      // Skip @rules
      if (trimmedSelector.startsWith('@')) {
        return match;
      }
      // Handle multiple selectors
      const scopedSelectors = trimmedSelector.split(',').map((sel: string) => {
        const cleanSelector = sel.trim();
        if (cleanSelector.startsWith(':host')) {
          return cleanSelector.replace(':host', scope);
        }
        return `${scope} ${cleanSelector}`;
      }).join(', ');
      return `${scopedSelectors} { ${rules} }`;
    });
  }

}

CssHelper.updateCssViewportUnits();
