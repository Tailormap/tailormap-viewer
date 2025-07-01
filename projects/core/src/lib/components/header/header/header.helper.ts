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

  public static shouldUseDropdownMenu(headerContainer: HTMLElement, measurementElement: HTMLElement): boolean {
    const logoWidth = HeaderHelper.getWidthWithMargin(headerContainer.querySelector('img'));
    const MIN_TITLE_WIDTH = 250; // Minimum width for the title area
    const containerWidth = headerContainer.offsetWidth - logoWidth - MIN_TITLE_WIDTH;
    return measurementElement.offsetWidth > containerWidth;
  }

  private static getWidthWithMargin(element?: HTMLElement | null): number {
    if (!element) {
      return 0;
    }
    const style = window.getComputedStyle(element);
    const marginLeft = parseFloat(style.marginLeft) || 0;
    const marginRight = parseFloat(style.marginRight) || 0;
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    return element.offsetWidth + marginLeft + marginRight + paddingLeft + paddingRight;
  }

}
