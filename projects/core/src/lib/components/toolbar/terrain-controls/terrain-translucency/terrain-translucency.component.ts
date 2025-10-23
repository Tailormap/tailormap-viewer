import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MapService } from '@tailormap-viewer/map';

@Component({
  selector: 'tm-terrain-translucency',
  templateUrl: './terrain-translucency.component.html',
  styleUrls: ['./terrain-translucency.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TerrainTranslucencyComponent {
  private mapService = inject(MapService);

  constructor() { }

  public setTerrainTranslucency(value: number): void {
    this.mapService.set3dTerrainTranslucency(value);
  }

  public resetTerrainTranslucency(): void {
    this.mapService.set3dTerrainTranslucency(1);
  }

}
