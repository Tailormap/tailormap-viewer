import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { concatMap, Observable, Subject, takeUntil, tap } from 'rxjs';
import {
  CoordinateHelper, MapClickToolConfigModel, MapClickToolModel, MapCursorHelper, MapService, ToolTypeEnum,
} from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { isActiveToolbarTool } from '../state/toolbar.selectors';
import { deregisterTool, registerTool, toggleTool } from '../state/toolbar.actions';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import { map, take } from 'rxjs/operators';
import { ApplicationStyleService } from '../../../services/application-style.service';
import { FeatureModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-streetview',
  templateUrl: './streetview.component.html',
  styleUrls: ['./streetview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreetviewComponent implements OnInit, OnDestroy {
  public toolActive$: Observable<boolean>;
  private destroyed = new Subject();
  private mapCRS = '';
  private streetviewLocation = new Subject<FeatureModel[]>();

  constructor(private store$: Store, private mapService: MapService) {
    this.toolActive$ = this.store$.select(isActiveToolbarTool(ToolbarComponentEnum.STREETVIEW));
    this.toolActive$.pipe(takeUntil(this.destroyed)).subscribe(isActive => {
      if (!isActive) {
        this.streetviewLocation.next([]);
      }
    });
    this.mapService.getProjectionCode$().pipe(take(1))
      .pipe().subscribe(projectionCode => {
      this.mapCRS = projectionCode;
    });
    this.toolActive$
      .pipe(takeUntil(this.destroyed))
      .subscribe(active => MapCursorHelper.setCrosshairCursor(active));
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
    })
      .pipe(takeUntil(this.destroyed),
        tap(({ tool }) => {
          this.store$.dispatch(registerTool({ tool: { id: ToolbarComponentEnum.STREETVIEW, mapToolId: tool.id } }));
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
        // tool stays active after click... otherwise
        // this.store$.dispatch(deactivateTool({tool: ToolbarComponentEnum.STREETVIEW}));
      },
    );
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
    this.store$.dispatch(deregisterTool({ tool: ToolbarComponentEnum.STREETVIEW }));
  }

  public toggle() {
    this.store$.dispatch(toggleTool({ tool: ToolbarComponentEnum.STREETVIEW }));
  }

}



