import { AfterViewInit, Component, ElementRef, inject, OnDestroy, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { MapService } from '../map-service/map.service';
import { CooperativeGesturesHelper, SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { combineLatest, take } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAP_COOPERATIVE_GESTURES } from './map-cooperative-gestures.injection-token';

@Component({
    selector: 'tm-map',
    templateUrl: 'map.component.html',
    // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: 'map.component.css',
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private cooperativeGesturesHelper: CooperativeGesturesHelper | undefined;
  private el = inject(ElementRef);
  private mapService = inject(MapService);
  private snackBar = inject(MatSnackBar);

  public cooperativeGestures = inject(MAP_COOPERATIVE_GESTURES);
  private mapContainer = viewChild<ElementRef<HTMLElement>>('mapContainer');

  public ngAfterViewInit() {
    const nativeEl: HTMLElement | undefined = this.el.nativeElement;
    const mapContainer: HTMLElement | null | undefined = nativeEl?.querySelector('.map-container');
    if (!mapContainer) {
      return;
    }
    this.mapService.render(mapContainer);
    if (this.cooperativeGestures && nativeEl) {
      this.cooperativeGesturesHelper = new CooperativeGesturesHelper(nativeEl);
    }
    this.mapService.getCesiumManager$()
      .pipe(take(1))
      .subscribe((manager) => {
        const mapContainerElementRef = this.mapContainer();
        if (mapContainerElementRef) {
          manager.enableKeyboardControl(mapContainerElementRef.nativeElement);
        }
      });
  }

  public ngOnDestroy() {
    if (this.cooperativeGesturesHelper) {
      this.cooperativeGesturesHelper.destroy();
    }
  }

  public onFocus() {
    const mapContainer = this.mapContainer();
    if (!mapContainer || !mapContainer.nativeElement.matches(':focus-visible')) {
      return;
    }
    this.mapService.getIn3d$().pipe(take(1)).subscribe(in3d => {
      if (in3d) {
        this.showSnackbarMessage($localize `:@@core.map.control-3d-hint:Use the arrow keys to move and shift + arrow keys to rotate`);
      }
    });
  }

  public onEnterKey() {
    const mapContainer = this.mapContainer();
    if (!mapContainer || !mapContainer.nativeElement.matches(':focus-visible')) {
      return;
    }
    const target = mapContainer.nativeElement.querySelector('canvas')
      ?? mapContainer.nativeElement.querySelector('.ol-viewport');
    if (!target) {
      return;
    }
    combineLatest([
      this.mapService.getCesiumManager$(),
      this.mapService.getIn3d$(),
    ])
      .pipe(take(1))
      .subscribe(([ manager, in3d ]) => {
        if (manager && in3d) {
          manager.simulateCenterClick();
        }
    });
    const rect = target.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;
    const eventInit: PointerEventInit = {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      buttons: 1,
      button: 0,
    };
    target.dispatchEvent(new PointerEvent('pointermove', eventInit));
    target.dispatchEvent(new PointerEvent('pointerdown', eventInit));
    target.dispatchEvent(new PointerEvent('pointerup', { ...eventInit, buttons: 0 }));
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX, clientY }));
  }

  private showSnackbarMessage(msg: string) {
    const config: SnackBarMessageOptionsModel = {
      message: msg,
      duration: 10000,
      showDuration: true,
      showCloseButton: true,
    };
    SnackBarMessageComponent.open$(this.snackBar, config).subscribe();
  }

}
