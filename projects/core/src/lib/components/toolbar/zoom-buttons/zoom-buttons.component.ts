import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MapViewDetailsModel, MapService } from '@tailormap-viewer/map';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'tm-zoom-buttons',
  templateUrl: './zoom-buttons.component.html',
  styleUrls: ['./zoom-buttons.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoomButtonsComponent {

  public resolution$: Observable<MapViewDetailsModel | null> = of(null);

  constructor(
    private mapService: MapService,
  ) {
    this.resolution$ = this.mapService.getMapViewDetails$();
  }

  public zoomIn() {
    this.mapService.zoomIn();
  }

  public zoomOut() {
    this.mapService.zoomOut();
  }

  public zoomToInitialExtent() {
    this.mapService.zoomToInitialExtent();
  }
}
