import { AfterViewInit, Component, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { MapService } from '../map-service/map.service';
import { OverlayHelper } from '@tailormap-viewer/shared';
import { take } from 'rxjs';
import { CesiumEventManager } from '../openlayers-map/cesium-map/cesium-event-manager';

@Component({
  selector: 'tm-map',
  templateUrl: 'map.component.html',
  styleUrl: 'map.component.css',
  standalone: false,
})
export class MapComponent implements AfterViewInit, OnDestroy {

  public inIframe = window.self !== window.top;
  private overlayHelper: OverlayHelper | undefined;
  private el = inject( ElementRef);
  private mapService= inject(MapService);

  public mapFocusedByKeyboard = signal(false);
  public mouseDown = signal(false);

  private mapContainer = viewChild<ElementRef<HTMLElement>>('mapContainer');

  public ngAfterViewInit() {
    const nativeEl: HTMLElement | undefined = this.el.nativeElement;
    const mapContainer: HTMLElement | null | undefined = nativeEl?.querySelector('.map-container');
    if (!mapContainer) {
      return;
    }
    this.mapService.render(mapContainer);
    if (this.inIframe && nativeEl) {
      this.overlayHelper = new OverlayHelper(nativeEl);
    }
  }

  public ngOnDestroy() {
    if (this.overlayHelper) {
      this.overlayHelper.destroy();
    }
  }

  public onFocus() {
    if (this.mouseDown()) {
      this.mouseDown.set(false);
      return;
    }
    this.mapFocusedByKeyboard.set(true);
    this.mapService.getCesiumManager$().pipe(take(1)).subscribe((manager) => {
      if (manager) {
        manager.executeScene3dAction(scene3d => {
          const mapContainer = this.mapContainer();
          if (mapContainer) {
            CesiumEventManager.enableKeyboardControl(scene3d, mapContainer.nativeElement);
          }
        });
      }
    });
  }

  public onEnterKey() {
    const mapContainer = this.mapContainer();
    if (!this.mapFocusedByKeyboard() || !mapContainer) {
      return;
    }
    const target = mapContainer.nativeElement.querySelector('canvas')
      ?? mapContainer.nativeElement.querySelector('.ol-viewport');
    console.debug("enter key with target:", target);
    if (!target) {
      return;
    }
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

}
