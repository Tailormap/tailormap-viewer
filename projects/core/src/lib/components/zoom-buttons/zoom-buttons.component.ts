import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MapResolutionModel, MapService } from '@tailormap-viewer/map';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'tm-zoom-buttons',
  templateUrl: './zoom-buttons.component.html',
  styleUrls: ['./zoom-buttons.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoomButtonsComponent {

  public resolution$: Observable<MapResolutionModel | null> = of(null);

  constructor(
    private mapService: MapService,
  ) {
    this.resolution$ = this.mapService.getResolution$();
  }

  public zoomIn() {
    this.mapService.zoomIn();
  }

  public zoomOut() {
    this.mapService.zoomOut();
  }

}
