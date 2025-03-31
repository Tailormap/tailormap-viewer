import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { concatMap, map, Observable, of, Subject, take, takeUntil, tap } from 'rxjs';
import { MapClickEvent, MapClickToolConfigModel, MapClickToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { Clipboard } from '@angular/cdk/clipboard';
import { Store } from '@ngrx/store';
import { isActiveToolbarTool } from '../state/toolbar.selectors';
import { deregisterTool, registerTool, toggleTool } from '../state/toolbar.actions';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { FeatureModel } from '@tailormap-viewer/api';
import { ApplicationStyleService } from '../../../services/application-style.service';
import { selectMapSettings } from '../../../map/state/map.selectors';


@Component({
  selector: 'tm-clicked-coordinates',
  templateUrl: './clicked-coordinates.component.html',
  styleUrls: ['./clicked-coordinates.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ClickedCoordinatesComponent implements OnInit, OnDestroy {

  public toolActive$: Observable<boolean>;

  public coordinatesForm = new FormGroup({
    x: new FormControl<number | null>(null),
    y: new FormControl<number | null>(null),
    minx: new FormControl<number | null>(null),
    miny: new FormControl<number | null>(null),
    maxx: new FormControl<number | null>(null),
    maxy: new FormControl<number | null>(null),
  }, { validators: validateCoordinates() });

  private destroyed = new Subject();
  private clickLocationSubject = new Subject<FeatureModel[]>();
  private clickLocationSubject$ = this.clickLocationSubject.asObservable();
  private crs:string = '';

  constructor(private store$: Store, private mapService: MapService, private clipboard: Clipboard) {
    this.toolActive$ = this.store$.select(isActiveToolbarTool(ToolbarComponentEnum.SELECT_COORDINATES));
    this.toolActive$.pipe(takeUntil(this.destroyed)).subscribe(isActive => {
      if (!isActive) {
        //only reset the input fields, not the hidden fields
        this.coordinatesForm.patchValue({ x: null, y:  null }, { emitEvent: false });
        this.clickLocationSubject.next([]);
      }
    });

    this.store$.select(selectMapSettings).pipe(
      takeUntil(this.destroyed),
      map(settings => {
        if (settings?.crs?.bounds && settings?.maxExtent) {
          this.crs = settings?.crs?.code;
          const bounds = settings?.crs?.bounds;
          const maxExtent = settings?.maxExtent;
          return [
             Math.min(bounds.minx, maxExtent.minx),
             Math.min(bounds.miny, maxExtent.miny),
             Math.max(bounds.maxx, maxExtent.maxx),
             Math.max(bounds.maxy, maxExtent.maxy),
          ];
        } else {
          return [];
        }
      })).subscribe(bounds => {
        if(bounds.length > 0) {
          this.coordinatesForm.patchValue({
            minx: bounds[0], miny: bounds[1], maxx: bounds[2], maxy: bounds[3],
          }, { emitEvent: false });
        }
    });
  }

  public ngOnInit(): void {
    this.mapService.createTool$<MapClickToolModel, MapClickToolConfigModel>({
      type: ToolTypeEnum.MapClick,
    })
      .pipe(
        takeUntil(this.destroyed),
        tap(({ tool }) => {
          this.store$.dispatch(registerTool({ tool: { id: ToolbarComponentEnum.SELECT_COORDINATES, mapToolId: tool.id } }));
        }),
        concatMap(({ tool }) => tool?.mapClick$ || of(null)),
      ).subscribe(mapClick => this.handleMapClick(mapClick));

    this.mapService.renderFeatures$('tm-clicked-coordinates-layer', this.clickLocationSubject$, f => {
      const primaryColor = ApplicationStyleService.getPrimaryColor();
      // draw a circle with a box inside
      if (f.__fid === 'clicked-coordinates-point') {
        return {
          styleKey: 'tm-clicked-coordinates',
          zIndex: 2000,
          pointType: 'circle',
          pointSize: 15,
          pointFillColor: 'transparent',
          pointStrokeColor: primaryColor,
          pointStrokeWidth: 3,
        };
      } else {
        return {
          styleKey: 'tm-clicked-coordinates-2',
          zIndex: 1999,
          pointType: 'square',
          pointSize: 5,
          pointRotation: 45,
          pointFillColor: 'transparent',
          pointStrokeColor: primaryColor,
          pointStrokeWidth: 2,
        };
      }
    }).pipe(takeUntil(this.destroyed)).subscribe();
  }

  public ngOnDestroy() {
    this.clickLocationSubject.complete();
    this.destroyed.next(null);
    this.destroyed.complete();
    this.store$.dispatch(deregisterTool({ tool: ToolbarComponentEnum.SELECT_COORDINATES }));
  }

  public toggle() {
    this.store$.dispatch(toggleTool({ tool: ToolbarComponentEnum.SELECT_COORDINATES }));
  }

  public copy() {
    if (this.coordinatesForm.valid) {
      this.clipboard.copy(`${this.coordinatesForm.get('x')?.value}, ${this.coordinatesForm.get('y')?.value}`);
    }
  }

  public goTo() {
    if (this.coordinatesForm.valid) {
      const x = this.coordinatesForm.getRawValue().x;
      const y = this.coordinatesForm.getRawValue().y;
      if (x != null && y != null) {
        this.pushLocationFeature([ x, y ]);
        this.mapService.zoomTo(`POINT(${x} ${y})`, this.crs);
      }
    }
  }

  private handleMapClick(mapClick: MapClickEvent) {
    if(mapClick && mapClick.mapCoordinates) {
      this.pushLocationFeature(mapClick.mapCoordinates);
      this.mapService.getRoundedCoordinates$(mapClick.mapCoordinates)
        .pipe(
          take(1),
          map(coordinates => {
            this.coordinatesForm.patchValue({ x: parseFloat(coordinates[0]), y: parseFloat(coordinates[1]) });
          })).subscribe();
    }
  }

  private pushLocationFeature(coordinates: number[]) {
    this.clickLocationSubject.next([{
      __fid: 'clicked-coordinates-point', geometry: `POINT(${coordinates[0]} ${coordinates[1]})`, attributes: {},
    }, {
      __fid: 'clicked-coordinates-point-2', geometry: `POINT(${coordinates[0]} ${coordinates[1]})`, attributes: {},
    }]);
  }
}

export function validateCoordinates(): ValidatorFn {
  return (form: AbstractControl): ValidationErrors | null => {
    const values = form.getRawValue();
    return values.x !== null && values.y !== null &&
      values.x >= values.minx && values.x <= values.maxx &&
      values.y >= values.miny && values.y <= values.maxy ? null : { invalidCoordinates: true };
  };
}
