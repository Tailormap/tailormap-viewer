import { BrowserHelper } from './browser.helper';

export class CooperativeGesturesHelper {

  private static WINDOWS_MESSAGE = $localize `:@@shared.cooperative-gestures-helper.windows:Use ctrl + scroll to zoom the map`;
  private static MAC_MESSAGE = $localize `:@@shared.cooperative-gestures-helper.mac:Use cmd (⌘) + scroll to zoom the map`;
  private static TOUCH_MESSAGE = $localize `:@@shared.cooperative-gestures-helper.touch:Use two fingers to move the map`;
  private static AUTO_HIDE_TIME = 3000;

  private overlayElement: HTMLElement | undefined;
  private overlayVisible = false;
  private autoHideTimer: number | undefined;

  private mouseWheelHandler = this.handleMouseWheel.bind(this);
  private touchEventHandler = this.handleTouchStart.bind(this);
  private hideOverlayHandler = this.hideOverlay.bind(this);

  constructor(
    private hostEl: HTMLElement,
    private overlayElementClass = 'cooperative-gestures-overlay',
    private overlayElementVisibleClass = 'cooperative-gestures-overlay-visible',
    private overlayElementHidingClass = 'cooperative-gestures-overlay-hiding',
  ) {
    this.addEventHandlers();
  }

  public addEventHandlers() {
    const overlayElement = this.hostEl?.querySelector<HTMLElement>(`.${this.overlayElementClass}`);
    if (!this.hostEl || !overlayElement) {
      return;
    }
    this.overlayElement = overlayElement;
    this.hostEl.addEventListener('wheel', this.mouseWheelHandler);
    this.hostEl.addEventListener("touchstart", this.touchEventHandler);
    this.hostEl.addEventListener("touchend", this.hideOverlayHandler);
    this.hostEl.addEventListener('mouseleave', this.hideOverlayHandler);
    this.hostEl.addEventListener('mousedown', this.hideOverlayHandler);
  }

  public destroy() {
    this.hostEl.removeEventListener('wheel', this.mouseWheelHandler);
    this.hostEl.removeEventListener("touchstart", this.touchEventHandler);
    this.hostEl.removeEventListener("touchend", this.hideOverlayHandler);
    this.hostEl.removeEventListener('mouseleave', this.hideOverlayHandler);
    this.hostEl.removeEventListener('mousedown', this.hideOverlayHandler);
  }

  private handleMouseWheel(e: WheelEvent) {
    // zoom in key (meta | ctrl) key also pressed
    if ((BrowserHelper.isMac && e.metaKey) || (!BrowserHelper.isMac && e.ctrlKey)) {
      this.hideOverlay();
      return;
    }
    // Viewport coordinates: offsetTop/pageY is wrong when the page scrolls or the host has an offset parent
    const rect = this.hostEl.getBoundingClientRect();
    const withinX = (e.clientX >= rect.left && e.clientX <= rect.right);
    const withinY = (e.clientY >= rect.top && e.clientY <= rect.bottom);
    const withinMap = withinX && withinY;
    if (withinMap) {
      this.showOverlay(BrowserHelper.isMac ? CooperativeGesturesHelper.MAC_MESSAGE : CooperativeGesturesHelper.WINDOWS_MESSAGE);
    } else {
      this.hideOverlay();
    }
  }

  private handleTouchStart(e: TouchEvent) {
    if (e.touches.length <= 1) {
      this.showOverlay(CooperativeGesturesHelper.TOUCH_MESSAGE);
    } else {
      this.hideOverlay();
    }
  }

  private showOverlay(message: string) {
    if (this.autoHideTimer) {
      window.clearTimeout(this.autoHideTimer);
    }
    this.autoHideTimer = window.setTimeout(() => {
      this.hideOverlay();
    }, CooperativeGesturesHelper.AUTO_HIDE_TIME);
    if (this.overlayVisible) {
      return;
    }
    this.overlayVisible = true;
    this.overlayElement?.classList.add(this.overlayElementVisibleClass);
    const messageEl = this.overlayElement?.querySelector<HTMLElement>('.message');
    if (messageEl) {
      messageEl.innerText = message;
    }
  }

  private hideOverlay() {
    if (!this.overlayVisible) {
      return;
    }
    this.overlayVisible = false;
    const removeHidingCls = () => {
      this.overlayElement?.classList.remove(this.overlayElementHidingClass);
      this.overlayElement?.removeEventListener('transitionend', removeHidingCls);
    };
    this.overlayElement?.addEventListener('transitionend', removeHidingCls);
    this.overlayElement?.classList.add(this.overlayElementHidingClass);
    this.overlayElement?.classList.remove(this.overlayElementVisibleClass);
  }

}
