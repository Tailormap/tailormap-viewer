import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { MapService } from '@tailormap-viewer/map';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'tm-terrain-opacity',
  templateUrl: './terrain-opacity.component.html',
  styleUrls: ['./terrain-opacity.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TerrainOpacityComponent implements OnInit {
  private mapService = inject(MapService);
  public terrainOpacity$: Observable<number> = of(1);

  public ngOnInit(): void {
    this.terrainOpacity$ = this.mapService.get3dTerrainOpacity$();
  }

  public setTerrainOpacity(value: number): void {
    this.mapService.set3dTerrainOpacity(value);
  }

  public resetTerrainOpacity(): void {
    this.mapService.set3dTerrainOpacity(1);
  }

  public toPercentageString(opacity: number): string {
    return `${Math.round(opacity * 100)}%`;
  }

}
