import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { concatMap, map, Observable, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { MapClickToolConfigModel, MapClickToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { Clipboard } from '@angular/cdk/clipboard';
import { Store } from '@ngrx/store';
import { isActiveToolbarTool } from '../state/toolbar.selectors';
import { deregisterTool, registerTool, toggleTool } from '../state/toolbar.actions';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { FeatureModel } from '@tailormap-viewer/api';
import { ApplicationStyleService } from '../../../services/application-style.service';


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
    xControl: new FormControl<number | null>(null), yControl: new FormControl<number | null>(null),
  }, { validators: validateCoordinates() });

  private destroyed = new Subject();
  private clickLocationSubject = new Subject<FeatureModel[]>();
  private clickLocationSubject$ = this.clickLocationSubject.asObservable();

  constructor(private store$: Store, private mapService: MapService, private clipboard: Clipboard) {
    this.toolActive$ = this.store$.select(isActiveToolbarTool(ToolbarComponentEnum.SELECT_COORDINATES));

    this.toolActive$.pipe(takeUntil(this.destroyed)).subscribe(isActive => {
      if (!isActive) {
        this.coordinatesForm.reset();
        // TODO maybe not needed
        this.clickLocationSubject.next([]);
        // TODO this doesn't seem to work, after deactivating and reactivating we can no longer draw the click location
        //  remove the layer when the tool is deactivated?
        // this.mapService.getLayerManager$().pipe(takeUntil(this.destroyed)).subscribe(layerManager => {
        //   layerManager.removeLayer('tm-clicked-coordinates-layer');
        // })
      }
    });

  }

  public ngOnInit(): void {
    this.mapService.createTool$<MapClickToolModel, MapClickToolConfigModel>({
      type: ToolTypeEnum.MapClick,
    })
      .pipe(takeUntil(this.destroyed), tap(({ tool }) => {
        this.store$.dispatch(registerTool({ tool: { id: ToolbarComponentEnum.SELECT_COORDINATES, mapToolId: tool.id } }));
      }), concatMap(({ tool }) => tool.mapClick$), switchMap(mapClick => {
        this.pushLocation(mapClick.mapCoordinates);
        return this.mapService.getRoundedCoordinates$(mapClick.mapCoordinates)
          .pipe(map(coordinates => {
            this.coordinatesForm.get('xControl')?.setValue(Number.parseFloat(coordinates[0]));
            this.coordinatesForm.get('yControl')?.setValue(Number.parseFloat(coordinates[1]));
          }));
      })).subscribe();

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
          pointStrokeWidth: 1,
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
      this.clipboard.copy(`${this.coordinatesForm.get('xControl')?.value}, ${this.coordinatesForm.get('yControl')?.value}`);
    }
  }

  public goTo() {
    if (this.coordinatesForm.valid) {
      // we can safely cast the values to number since the form is valid
      const x = this.coordinatesForm.get('xControl')?.value as number;
      const y = this.coordinatesForm.get('yControl')?.value as number;
      this.pushLocation([ x, y ]);
      this.mapService.setCenterAndZoom([ x, y ], 15);
    }
  }

  private pushLocation(coordinates: number[]) {
    this.clickLocationSubject.next([{
      __fid: 'clicked-coordinates-point', geometry: `POINT(${coordinates[0]} ${coordinates[1]})`, attributes: {},
    }, {
      __fid: 'clicked-coordinates-point-2', geometry: `POINT(${coordinates[0]} ${coordinates[1]})`, attributes: {},
    }]);
  }
}

export function validateCoordinates(): ValidatorFn {
  return (form: AbstractControl): ValidationErrors | null => {
    const xValue: number = form.get('xControl')?.value;
    const yValue: number = form.get('yControl')?.value;

    // TODO: get the bounds from the CRS and application max extent and check if the coordinates are within those bounds
    const isValid = xValue && yValue && xValue > 0 && yValue > 0 ? null : { invalidCoordinates: true };

    console.log('TODO form validation, values', xValue, yValue, 'is valid?', isValid);

    return isValid;
  };
}
