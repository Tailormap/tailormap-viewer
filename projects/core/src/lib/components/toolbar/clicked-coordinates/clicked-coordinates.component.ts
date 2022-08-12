import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { concatMap, map, Observable, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { MapClickToolConfigModel, MapClickToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { Store } from '@ngrx/store';
import { isActiveToolbarTool } from '../state/toolbar.selectors';
import { deregisterTool, registerTool, toggleTool } from '../state/toolbar.actions';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';

@Component({
  selector: 'tm-clicked-coordinates',
  templateUrl: './clicked-coordinates.component.html',
  styleUrls: ['./clicked-coordinates.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClickedCoordinatesComponent implements OnInit, OnDestroy {

  public toolActive$: Observable<boolean>;
  private destroyed = new Subject();

  constructor(
    private store$: Store,
    private mapService: MapService,
    private snackBar: MatSnackBar,
    private clipboard: Clipboard,
  ) {
    this.toolActive$ = this.store$.select(isActiveToolbarTool(ToolbarComponentEnum.SELECT_COORDINATES));
    this.toolActive$.pipe(
      takeUntil(this.destroyed)).subscribe(isActive => {
      if (!isActive) {
        this.snackBar.dismiss();
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
          this.store$.dispatch(registerTool({tool: {id: ToolbarComponentEnum.SELECT_COORDINATES, mapToolId: tool.id}}));
        }),
        concatMap(({ tool }) => tool.mapClick$),
        switchMap(mapClick => {
          this.snackBar.dismiss();
          return this.mapService.getRoundedCoordinates$(mapClick.mapCoordinates)
            .pipe(map(coordinates => coordinates.join(', ')));
        }),
        concatMap(coordinates => {
          const coordinatesMsg = $localize`Selected coordinates: ${coordinates}`;
          return this.snackBar.open(coordinatesMsg, $localize`Copy`).onAction().pipe(
            map(() => {
              return this.clipboard.copy(coordinates) ? $localize`Success` : $localize`Failed to copy to clipboard`;
            }),
          );
        }),
      ).subscribe(
      succesMsg => {
        this.snackBar.open(succesMsg, '', {duration: 5000});
      },
    );
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
    this.snackBar.dismiss();
    this.store$.dispatch(deregisterTool({ tool: ToolbarComponentEnum.SELECT_COORDINATES }));
  }

  public toggle() {
    this.store$.dispatch(toggleTool({tool: ToolbarComponentEnum.SELECT_COORDINATES}));
  }
}
