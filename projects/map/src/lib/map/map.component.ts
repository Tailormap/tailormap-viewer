import { AfterViewInit, Component, ElementRef, OnDestroy, inject } from '@angular/core';
import { MapService } from '../map-service/map.service';
import { OverlayHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-map',
  templateUrl: 'map.component.html',
  styleUrl: 'map.component.css',
  standalone: false,
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private mapService = inject(MapService);


  public inIframe = window.self !== window.top;
  private overlayHelper: OverlayHelper | undefined;

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


}
