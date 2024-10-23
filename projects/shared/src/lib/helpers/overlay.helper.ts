import { BrowserHelper } from './browser.helper';

export class OverlayHelper {

  private static WINDOWS_MESSAGE = $localize `:@@shared.overlay-helper.windows:Use ctrl + scroll to zoom the map`;
  private static MAC_MESSAGE = $localize `:@@shared.overlay-helper.mac:Use cmd (⌘) + scroll to zoom the map`;
  private static TOUCH_MESSAGE = $localize `:@@shared.overlay-helper.touch:Use two fingers to move the map`;

  private embeddedElement: HTMLElement | undefined;
  private overlayVisible = false;
  private elSize = { left: 0, right: 0, top: 0, bottom: 0 };

  private mouseWheelHandler = this.handleMouseWheel.bind(this);
  private touchEventHandler = this.handleTouchStart.bind(this);
  private hideOverlayHandler = this.hideOverlay.bind(this);
  private resizeHandler = this.setElementSize.bind(this);

  constructor(
    private hostEl: HTMLElement,
    private embeddedElementClass = 'embedded-overlay',
    private embeddedElementVisibleClass = 'embedded-overlay-visible',
  ) {
    this.addEmbeddedHandlers();
  }

  public addEmbeddedHandlers() {
    const embeddedElement = this.hostEl?.querySelector<HTMLElement>(`.${this.embeddedElementClass}`);
    if (!this.hostEl || !embeddedElement) {
      return;
    }
    this.embeddedElement = embeddedElement;
    this.setElementSize();
    window.addEventListener('resize', this.resizeHandler);
    this.hostEl.addEventListener('wheel', this.mouseWheelHandler);
    this.hostEl.addEventListener("touchstart", this.touchEventHandler);
    this.hostEl.addEventListener("touchend", this.hideOverlayHandler);
    this.hostEl.addEventListener('mouseleave', this.hideOverlayHandler);
  }

  public destroy() {
    window.removeEventListener('resize', this.resizeHandler);
    this.hostEl.removeEventListener('wheel', this.mouseWheelHandler);
    this.hostEl.removeEventListener("touchstart", this.touchEventHandler);
    this.hostEl.removeEventListener("touchend", this.hideOverlayHandler);
    this.hostEl.removeEventListener('mouseleave', this.hideOverlayHandler);
  }

  private setElementSize() {
    const left = this.hostEl.offsetLeft;
    const right = left + this.hostEl.offsetWidth;
    const top = this.hostEl.offsetTop;
    const bottom = top + this.hostEl.offsetHeight;
    this.elSize = { left, right, top, bottom };
  }

  private handleMouseWheel(e: WheelEvent) {
    // zoom in key (meta | ctrl) key also pressed
    if ((BrowserHelper.isMac && e.metaKey) || (!BrowserHelper.isMac && e.ctrlKey)) {
      this.hideOverlay();
      return;
    }
    const withinX = (e.pageX >= this.elSize.left && e.pageX <= this.elSize.right);
    const withinY = (e.pageY >= this.elSize.top && e.pageY <= this.elSize.bottom);
    const withinMap = withinX && withinY;
    if (withinMap) {
      this.showOverlay(BrowserHelper.isMac ? OverlayHelper.MAC_MESSAGE : OverlayHelper.WINDOWS_MESSAGE);
    } else {
      this.hideOverlay();
    }
  }

  private handleTouchStart(e: TouchEvent) {
    if (e.touches.length <= 1) {
      this.showOverlay(OverlayHelper.TOUCH_MESSAGE);
    } else {
      this.hideOverlay();
    }
  }

  private showOverlay(message: string) {
    if (this.overlayVisible) {
      return;
    }
    this.overlayVisible = true;
    this.embeddedElement?.classList.add(this.embeddedElementVisibleClass);
    const messageEl = this.embeddedElement?.querySelector<HTMLElement>('.message');
    if (messageEl) {
      messageEl.innerText = message;
    }
  }

  private hideOverlay() {
    if (!this.overlayVisible) {
      return;
    }
    this.overlayVisible = false;
    this.embeddedElement?.classList.remove(this.embeddedElementVisibleClass);
  }

}
