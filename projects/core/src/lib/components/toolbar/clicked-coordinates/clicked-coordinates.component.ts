import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { concatMap, filter, Observable, Subject, takeUntil, tap } from 'rxjs';
import { MapClickToolConfigModel, MapClickToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { $localize } from '@angular/localize/init';
import { Store } from '@ngrx/store';
import { isActiveToolbarTool } from '../state/toolbar.selectors';
import { registerTool, toggleTool } from '../state/toolbar.actions';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';

@Component({
  selector: 'tm-clicked-coordinates',
  templateUrl: './clicked-coordinates.component.html',
  styleUrls: ['./clicked-coordinates.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClickedCoordinatesComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public toolActive$: Observable<boolean>;

  constructor(
    private store$: Store,
    private mapService: MapService,
    private snackBar: MatSnackBar,
    private clipboard: Clipboard,
  ) {
    this.toolActive$ = this.store$.select(isActiveToolbarTool(ToolbarComponentEnum.SELECT_COORDINATES));
  }

  public ngOnInit(): void {
    this.mapService.createTool$<MapClickToolModel, MapClickToolConfigModel>({
      type: ToolTypeEnum.MapClick,
    })
      .pipe(
        takeUntil(this.destroyed),
        filter(Boolean),
        tap(clickTool => {
          this.store$.dispatch(registerTool({ tool: { id: ToolbarComponentEnum.SELECT_COORDINATES, mapToolId: clickTool.id }}));
        }),
        concatMap(clickTool => clickTool.mapClick$),
      )
      .subscribe(mapClick => {
        this.handleMapClick(mapClick);
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public toggle() {
    this.store$.dispatch(toggleTool({ tool: ToolbarComponentEnum.SELECT_COORDINATES }));
  }

  private handleMapClick(evt: { mapCoordinates: [number, number]; mouseCoordinates: [number, number] }) {
    let decimals = 4;
    this.mapService.getUnitsOfMeasure$().subscribe(uom => {
      switch (uom) {
        case 'm':
          decimals = 2;
          break;
        case 'ft':
        case 'us-ft':
          decimals = 3;
          break;
        case 'degrees':
        default:
          decimals = 4;
      }
    });

    const coordinatesMsg = $localize`Selected coordinates: ${evt.mapCoordinates[0].toFixed(decimals)}, ${evt.mapCoordinates[1].toFixed(decimals)}`;

    this.snackBar.open(coordinatesMsg, $localize`Copy`).onAction().subscribe(() => {
      if (this.clipboard.copy(coordinatesMsg)) {
        this.snackBar.open($localize`Success`, '', {duration: 5000});
      } else {
        this.snackBar.open($localize`Failed to copy to clipboard`, '', {duration: 5000});
      }
    });
  }
}
