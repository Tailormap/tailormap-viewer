export class BrowserHelper {
  public static isTouchDevice = ('ontouchstart' in window);
  public static isMobile = window.matchMedia ? !window.matchMedia('(min-device-width: 1200px)').matches : false;
  public static isHiDPI = window.devicePixelRatio > 1;
}
