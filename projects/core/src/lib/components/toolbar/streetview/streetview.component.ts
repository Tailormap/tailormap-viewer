import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { concatMap, Subject, takeUntil, tap } from 'rxjs';
import {
  CoordinateHelper, MapClickToolConfigModel, MapClickToolModel, MapService, ToolTypeEnum,
} from '@tailormap-viewer/map';
import { map, take } from 'rxjs/operators';
import { ApplicationStyleService } from '../../../services/application-style.service';
import { BaseComponentTypeEnum, FeatureModel } from '@tailormap-viewer/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-streetview',
  templateUrl: './streetview.component.html',
  styleUrls: ['./streetview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class StreetviewComponent implements OnInit, OnDestroy {
  private mapService = inject(MapService);
  private destroyRef = inject(DestroyRef);

  public toolActive = signal<boolean>(false);
  private destroyed = new Subject();
  private mapCRS = '';
  private streetviewLocation = new Subject<FeatureModel[]>();
  private tool: string | undefined;

  constructor() {
    this.mapService.someToolsEnabled$([BaseComponentTypeEnum.STREETVIEW])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(enabled => {
        this.toolActive.set(enabled);
        if (!enabled) {
          this.streetviewLocation.next([]);
        }
      });
    this.mapService.getProjectionCode$().pipe(take(1))
      .pipe().subscribe(projectionCode => {
      this.mapCRS = projectionCode;
    });
  }

  public ngOnInit(): void {
    this.mapService.renderFeatures$('streetview-layer', this.streetviewLocation.asObservable(), () => {
      const primaryColor = ApplicationStyleService.getPrimaryColor();
      return {
        styleKey: 'streetview-style',
        zIndex: 1000,
        pointType: 'arrow',
        pointSize: 15,
        pointFillColor: primaryColor,
        pointStrokeColor: '#ffffff',
        pointStrokeWidth: 2,
        pointRotation: 90,
      };
     }).pipe(takeUntil(this.destroyed)).subscribe();

    this.mapService.createTool$<MapClickToolModel, MapClickToolConfigModel>({
      type: ToolTypeEnum.MapClick,
      owner: BaseComponentTypeEnum.STREETVIEW,
    })
      .pipe(takeUntil(this.destroyed),
        tap(({ tool }) => {
          this.tool = tool.id;
        }),
        concatMap(({ tool }) => tool.mapClick$),
        map(mapClick => {
          this.streetviewLocation.next([
            { __fid: 'streetview-point', geometry: `POINT(${mapClick.mapCoordinates[0]} ${mapClick.mapCoordinates[1]})`, attributes: {} },
          ]);

          const coords = CoordinateHelper.projectCoordinates(
            [ mapClick.mapCoordinates[0], mapClick.mapCoordinates[1] ],
            this.mapCRS,
            'EPSG:4326');
          return { lon: coords[0], lat: coords[1] };
        })).subscribe(
      wgsCoord => {
        const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${wgsCoord.lat}%2C${wgsCoord.lon}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
    );
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
    this.mapService.disableTool(this.tool);
  }

  public toggle() {
    if (this.toolActive()) {
      this.mapService.disableTool(this.tool);
      return;
    }
    this.mapService.enableTool(this.tool, true);
  }

}



