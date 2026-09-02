import { Component, ChangeDetectionStrategy, inject, OnInit, input } from '@angular/core';
import { MapService } from '@tailormap-viewer/map';
import { Observable, of } from 'rxjs';
import { SliderComponent } from '../../../../../../../shared/src/lib/components/slider/slider.component';
import { MatIconButton } from '@angular/material/button';
import { TooltipDirective } from '../../../../../../../shared/src/lib/directives/tooltip.directive';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-terrain-opacity',
    templateUrl: './terrain-opacity.component.html',
    styleUrls: ['./terrain-opacity.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        SliderComponent,
        MatIconButton,
        TooltipDirective,
        MatIcon,
        AsyncPipe,
    ],
})
export class TerrainOpacityComponent implements OnInit {
  private mapService = inject(MapService);


  public label = input<string>('');
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
