import { CssHelper } from '@tailormap-viewer/shared';

export class HeaderHelper {

  public static HEADER_ID_COUNT = 0;

  public static setHeaderComponentCss(css: string, headerContainer: HTMLDivElement) {
    const scopeId = `header${HeaderHelper.HEADER_ID_COUNT++}`;
    headerContainer.id = scopeId;
    const currentCss = document.querySelector<HTMLStyleElement>('#header-component-css') || document.createElement('style');
    currentCss.id = 'header-component-css';
    currentCss.innerHTML = CssHelper.getScopedCss(css, `#${scopeId}`);
    if (currentCss.parentElement === null) {
      document.head.appendChild(currentCss);
    }
  }

  public static calculateVisibleMenuItems(headerContainer: HTMLElement, measurementElement: HTMLElement): number {
    const logoWidth = HeaderHelper.getWidthWithMargin(headerContainer.querySelector('img'));
    const MIN_TITLE_WIDTH = 250; // Minimum width for the title area
    const OVERFLOW_BUTTON_WIDTH = 48;
    const containerWidth = headerContainer.offsetWidth - logoWidth - MIN_TITLE_WIDTH;
    const measurementItems = measurementElement.querySelectorAll('a');
    let totalWidth = 0;
    let visibleCount = 0;
    for (let i = 0; i < measurementItems.length; i++) {
      const itemWidth = HeaderHelper.getWidthWithMargin(measurementItems[i]);
      if ((totalWidth + itemWidth) <= containerWidth) {
        totalWidth += itemWidth;
        visibleCount++;
      } else {
        break;
      }
    }
    // If we need an overflow button, make sure we have space for it
    const hasOverflowMenuItems = visibleCount < measurementItems.length;
    if (visibleCount > 0 && hasOverflowMenuItems && totalWidth + OVERFLOW_BUTTON_WIDTH > containerWidth) {
      visibleCount--;
    }
    return Math.max(0, visibleCount);
  }

  private static getWidthWithMargin(element?: HTMLElement | null): number {
    if (!element) {
      return 0;
    }
    const style = window.getComputedStyle(element);
    const marginLeft = parseFloat(style.marginLeft) || 0;
    const marginRight = parseFloat(style.marginRight) || 0;
    return element.offsetWidth + marginLeft + marginRight;
  }

}
