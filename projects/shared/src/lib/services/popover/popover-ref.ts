import { OverlayRef as CdkOverlayRef } from '@angular/cdk/overlay/overlay-ref';
import {
  OverlayRef,
} from '../overlay/overlay-ref';

interface PopoverRefConfig {
  origin: HTMLElement;
  closeOnClickOutside?: boolean;
}

// R is used in OverlayRef which is the superclass for this class
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class PopoverRef<R = any, T = any> extends OverlayRef {

  private readonly clickOutsideListener: (e: MouseEvent | TouchEvent) => void;
  private readonly clickInsideListener: (e: MouseEvent | TouchEvent) => void;

  constructor(
    public override overlay: CdkOverlayRef,
    public override data: T | undefined,
    protected refConfig?: PopoverRefConfig,
  ) {
    super(overlay, data);

    this.clickInsideListener = this.listenToClickInside.bind(this);
    this.clickOutsideListener = this.listenToClickOutside.bind(this);

    if (refConfig && refConfig.closeOnClickOutside && this.overlay) {
        window.setTimeout(() => {
          document.addEventListener('mousedown', this.clickOutsideListener);
          document.addEventListener('touchstart', this.clickOutsideListener);
          this.overlay.overlayElement.addEventListener('mousedown', this.clickInsideListener);
          this.overlay.overlayElement.addEventListener('touchstart', this.clickInsideListener);
        }, 0);
    }
  }

  public listenToClickInside(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  public listenToClickOutside() {
    this._close('backdropClick', this.data);
  }

  protected override destroy() {
    if (this.overlay && this.overlay.overlayElement) {
      this.overlay.overlayElement.removeEventListener('mousedown', this.clickInsideListener);
      this.overlay.overlayElement.removeEventListener('touchstart', this.clickInsideListener);
    }
    super.destroy();
    document.removeEventListener('mousedown', this.clickOutsideListener);
    document.removeEventListener('touchstart', this.clickOutsideListener);
  }

}
