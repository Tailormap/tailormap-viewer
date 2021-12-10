import { AfterViewInit, Component, ElementRef } from '@angular/core';
import { MapService } from '../map-service/map.service';

@Component({
  selector: 'tm-map',
  template: `<div class="map-container"></div>`,
  styles: [`
    :host,
    .map-container {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
    }
  `],
})
export class MapComponent implements AfterViewInit {

  constructor(
    private el: ElementRef,
    private mapService: MapService,
  ) { }

  public ngAfterViewInit() {
    this.mapService.render(this.el.nativeElement.querySelector('.map-container'));
  }

}
