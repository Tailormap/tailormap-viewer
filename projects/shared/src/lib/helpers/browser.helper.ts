export class BrowserHelper {
  public static isTouchDevice = ('ontouchstart' in window) && (navigator.maxTouchPoints > 0);
  public static isMobile = window.matchMedia ? !window.matchMedia('(min-device-width: 1200px)').matches : false;
  public static isHiDPI = window.devicePixelRatio > 1;
  public static isMac = navigator.userAgent.indexOf("Mac") > -1;
  public static getScreenWith = () => window.innerWidth;
  public static getScreenHeight = () => window.innerHeight;
}
