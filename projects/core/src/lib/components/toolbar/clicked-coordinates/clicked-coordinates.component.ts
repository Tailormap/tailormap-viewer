import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { concatMap, map, Observable, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { MapClickToolConfigModel, MapClickToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { Clipboard } from '@angular/cdk/clipboard';
import { Store } from '@ngrx/store';
import { isActiveToolbarTool } from '../state/toolbar.selectors';
import { deregisterTool, registerTool, toggleTool } from '../state/toolbar.actions';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';


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
  }, {validators: [validateCoordinates()]});

  private destroyed = new Subject();

  constructor(private store$: Store, private mapService: MapService, private clipboard: Clipboard) {
    this.toolActive$ = this.store$.select(isActiveToolbarTool(ToolbarComponentEnum.SELECT_COORDINATES));
    this.toolActive$.pipe(takeUntil(this.destroyed)).subscribe(isActive => {
      if (!isActive) {
        // TODO remove the marker from the map when closing
        this.coordinatesForm.reset();
      }
    });
  }

  public ngOnInit(): void {
    this.mapService.createTool$<MapClickToolModel, MapClickToolConfigModel>({
      type: ToolTypeEnum.MapClick,
    })
      .pipe(takeUntil(this.destroyed), tap(({tool}) => {
        this.store$.dispatch(registerTool({tool: {id: ToolbarComponentEnum.SELECT_COORDINATES, mapToolId: tool.id}}));
      }), concatMap(({tool}) => tool.mapClick$), switchMap(mapClick => {
        // TODO place a marker on the map
        return this.mapService.getRoundedCoordinates$(mapClick.mapCoordinates)
          .pipe(map(coordinates => {
            this.coordinatesForm.get('xControl')?.setValue(Number.parseFloat(coordinates[0]));
            this.coordinatesForm.get('yControl')?.setValue(Number.parseFloat(coordinates[1]));

            // TODO cleanup
            // old code to pass coords string to removed snackbar and clipboard
            return coordinates.join(', ');
          }));
      })).subscribe(coords => {
        // TODO cleanup
        console.log('clicked, rounded coords', coords);
    });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
    this.store$.dispatch(deregisterTool({tool: ToolbarComponentEnum.SELECT_COORDINATES}));
  }

  public toggle() {
    this.store$.dispatch(toggleTool({tool: ToolbarComponentEnum.SELECT_COORDINATES}));
  }

  public copy() {
    if (this.coordinatesForm.valid) {
      this.clipboard.copy(`${this.coordinatesForm.get('xControl')?.value}, ${this.coordinatesForm.get('yControl')?.value}`);
    }
  }

  public goTo() {
    if (this.coordinatesForm.valid) {
      this.mapService.setCenterAndZoom([// we can safely cast the values to number since the form is valid
        this.coordinatesForm.get('xControl')?.value as number, this.coordinatesForm.get('yControl')?.value as number], 10);
    }
  }
}

export function validateCoordinates(): ValidatorFn {
  return (form: AbstractControl): ValidationErrors | null => {
    const xValue: number = form.get('xControl')?.value;
    const yValue: number = form.get('yControl')?.value;

    // TODO: get the bounds from the CRS and application max extent and check if the coordinates are within those bounds
    const isValid = xValue && yValue && xValue > 0 && yValue > 0 ? null : {invalidCoordinates: true};

    console.log('form validation, values', xValue, yValue, 'is valid?', isValid);

    return isValid;
  };
}
