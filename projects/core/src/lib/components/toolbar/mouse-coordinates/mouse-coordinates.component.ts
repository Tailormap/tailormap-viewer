import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CoordinateHelper, MapService, MousePositionToolConfigModel, MousePositionToolModel, ToolTypeEnum } from '@tailormap-viewer/map';
import { combineLatest, map, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import {
  BaseComponentTypeEnum,
  MOUSE_COORDINATES_MAP_PROJECTION,
  MouseCoordinatesConfigModel,
  MouseCoordinatesDisplayConfigModel,
  MouseCoordinatesFormat,
} from '@tailormap-viewer/api';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { ComponentConfigHelper } from '../../../shared/helpers/component-config.helper';

interface MouseCoordinatesDisplayValue {
  id: string;
  label: string;
  coordinates: [string, string];
}

@Component({
  selector: 'tm-mouse-coordinates',
  templateUrl: './mouse-coordinates.component.html',
  styleUrls: ['./mouse-coordinates.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe],
})
export class MouseCoordinatesComponent implements OnInit, OnDestroy {
  private mapService = inject(MapService);
  private store$ = inject(Store);

  private destroyed = new Subject();
  public coordinates$: Observable<MouseCoordinatesDisplayValue[]> = of([]);
  private overCoordinatesElement = false;

  public ngOnInit(): void {
    const mouseMove$ = this.mapService.createTool$<MousePositionToolModel, MousePositionToolConfigModel>({
      type: ToolTypeEnum.MousePosition,
      alwaysEnabled: true,
      owner: BaseComponentTypeEnum.MOUSE_COORDINATES,
    }).pipe(switchMap(({ tool }) => tool.mouseMove$));

    const config$ = ComponentConfigHelper.componentConfig$<MouseCoordinatesConfigModel>(
      this.store$,
      BaseComponentTypeEnum.MOUSE_COORDINATES,
    );

    this.coordinates$ = combineLatest([
      mouseMove$,
      config$,
      this.mapService.getProjectionCode$(),
    ])
      .pipe(
        takeUntil(this.destroyed),
        switchMap(([ mouseMove, config, mapProjection ]) => {
          if (mouseMove.type === 'out' && !this.overCoordinatesElement) {
            return of([]);
          }

          if (!config.displays?.length) {
            return this.getDefaultCoordinates$(mouseMove.mapCoordinates);
          }

          const configuredCoordinates = this.getConfiguredCoordinates(
            mouseMove.mapCoordinates,
            config.displays,
            mapProjection,
          );

          return configuredCoordinates.length > 0
            ? of(configuredCoordinates)
            : this.getDefaultCoordinates$(mouseMove.mapCoordinates);
        }),
      );
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public isOverCoordinates(isOverCoordinates: boolean) {
    this.overCoordinatesElement = isOverCoordinates;
  }

  private getDefaultCoordinates$(coordinates: [number, number]): Observable<MouseCoordinatesDisplayValue[]> {
    return this.mapService.getRoundedCoordinates$(coordinates)
      .pipe(
        map(roundedCoordinates => [{
          id: 'map',
          label: '',
          coordinates: [ roundedCoordinates[0] || '', roundedCoordinates[1] || '' ],
        }]),
      );
  }

  private getConfiguredCoordinates(
    mapCoordinates: [number, number],
    displays: MouseCoordinatesDisplayConfigModel[],
    mapProjection: string,
  ): MouseCoordinatesDisplayValue[] {
    return displays.flatMap((display, index) => {
      const targetProjection = display.projection === MOUSE_COORDINATES_MAP_PROJECTION
        ? mapProjection
        : display.projection;

      try {
        const projectedCoordinates = targetProjection === mapProjection
          ? mapCoordinates
          : CoordinateHelper.projectCoordinates(mapCoordinates, mapProjection, targetProjection);

        return [{
          id: display.id || `coordinate-display-${index}`,
          label: display.label?.trim() || targetProjection,
          coordinates: this.formatCoordinates(projectedCoordinates, targetProjection, display.format),
        }];
      } catch {
        return [];
      }
    });
  }

  private formatCoordinates(
    coordinates: [number, number],
    projection: string,
    format: MouseCoordinatesFormat,
  ): [string, string] {
    switch (format) {
      case 'decimal-degrees':
        return [
          this.formatDecimalDegrees(coordinates[1], true),
          this.formatDecimalDegrees(coordinates[0], false),
        ];
      case 'degrees-decimal-minutes':
        return [
          this.formatDegreesDecimalMinutes(coordinates[1], true),
          this.formatDegreesDecimalMinutes(coordinates[0], false),
        ];
      default: {
        const precision = projection === 'EPSG:4326' ? 6 : 2;
        return [ coordinates[0].toFixed(precision), coordinates[1].toFixed(precision) ];
      }
    }
  }

  private formatDecimalDegrees(value: number, latitude: boolean): string {
    const hemisphere = latitude
      ? (value < 0 ? 'S' : 'N')
      : (value < 0 ? 'W' : 'E');
    return `${Math.abs(value).toFixed(6)}° ${hemisphere}`;
  }

  private formatDegreesDecimalMinutes(value: number, latitude: boolean): string {
    const hemisphere = latitude
      ? (value < 0 ? 'S' : 'N')
      : (value < 0 ? 'W' : 'E');

    const absoluteValue = Math.abs(value);
    let degrees = Math.floor(absoluteValue);
    let minutes = Number(((absoluteValue - degrees) * 60).toFixed(3));
    if (minutes >= 60) {
      degrees += 1;
      minutes = 0;
    }

    const degreeWidth = latitude ? 2 : 3;
    const degreesText = degrees.toString().padStart(degreeWidth, '0');
    const minutesText = minutes.toFixed(3).padStart(6, '0');
    return `${degreesText}° ${minutesText}' ${hemisphere}`;
  }
}
