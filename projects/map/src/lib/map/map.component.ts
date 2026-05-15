import { AfterViewInit, Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { MapService } from '../map-service/map.service';
import { OverlayHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-map',
  templateUrl: 'map.component.html',
  styleUrl: 'map.component.css',
  standalone: false,
})
export class MapComponent implements AfterViewInit, OnDestroy {

  public inIframe = window.self !== window.top;
  public mapFocusedByKeyboard = false;
  public mouseDown = false;
  private overlayHelper: OverlayHelper | undefined;
  private el = inject( ElementRef);
  private mapService= inject(MapService);

  @ViewChild('mapContainer')
  private mapContainer: ElementRef<HTMLElement> | undefined;

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
    if (this.mouseDown) {
      this.mouseDown = false;
      return;
    }
    this.mapFocusedByKeyboard = true;
  }

  public onEnterKey() {
    if (!this.mapFocusedByKeyboard || !this.mapContainer) {
      return;
    }
    console.debug('Enter key pressed, focus on map');
    const target = this.mapContainer.nativeElement.querySelector('canvas')
      ?? this.mapContainer.nativeElement.querySelector('.ol-viewport');
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
    console.debug("x:", clientX, "y:", clientY);
    target.dispatchEvent(new PointerEvent('pointermove', eventInit));
    target.dispatchEvent(new PointerEvent('pointerdown', eventInit));
    target.dispatchEvent(new PointerEvent('pointerup', { ...eventInit, buttons: 0 }));
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX, clientY }));
  }

}
