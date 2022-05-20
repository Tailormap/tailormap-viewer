import { Subject } from 'rxjs';

import { OverlayRef as CdkOverlayRef } from '@angular/cdk/overlay';
import { takeUntil } from 'rxjs/operators';

export interface OverlayCloseEvent<R> {
  type: 'backdropClick' | 'close';
  data: R;
}

// R = Response Data Type, T = Data passed to Modal Type
export class OverlayRef<R = any, T = any> {

  protected afterClosedSubject$ = new Subject<OverlayCloseEvent<R | undefined>>();
  public afterClosed$ = this.afterClosedSubject$.asObservable();

  public isOpen: boolean;
  private destroyed = new Subject();

  constructor(
    public overlay: CdkOverlayRef,
    public data: T,
  ) {
    this.isOpen = true;
    overlay.backdropClick()
      .pipe(takeUntil(this.destroyed))
      .subscribe(() => this._close('backdropClick', undefined));
  }

  public close(data?: R) {
    if (!this.isOpen) {
      return;
    }
    this._close('close', data);
  }

  protected _close(type: 'backdropClick' | 'close', data: R | undefined) {
    if (!this.isOpen) {
      return;
    }
    this.isOpen = false;
    this.destroy();
    this.overlay.dispose();
    this.afterClosedSubject$.next({ type,  data });
    this.afterClosedSubject$.complete();
  }

  protected destroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
