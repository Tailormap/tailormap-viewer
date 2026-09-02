import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MapViewDetailsModel, MapService } from '@tailormap-viewer/map';
import { Observable, of } from 'rxjs';
import { MatButton } from '@angular/material/button';
import { TooltipDirective } from '../../../../../../shared/src/lib/directives/tooltip.directive';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-zoom-buttons',
    templateUrl: './zoom-buttons.component.html',
    styleUrls: ['./zoom-buttons.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatButton,
        TooltipDirective,
        MatIcon,
        AsyncPipe,
    ],
})
export class ZoomButtonsComponent {
  private mapService = inject(MapService);


  public resolution$: Observable<MapViewDetailsModel | null> = of(null);

  constructor() {
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
