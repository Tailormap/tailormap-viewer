import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, OnDestroy } from '@angular/core';
import { MapClickToolConfigModel, MapClickToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { concatMap, of, tap } from 'rxjs';
import { activateTool, deactivateTool, deregisterTool, registerTool } from '../../toolbar/state/toolbar.actions';
import { ToolbarComponentEnum } from '../../toolbar/models/toolbar-component.enum';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { selectEditActiveWithSelectedLayer, selectEditError$ } from '../state/edit.selectors';
import { loadEditFeatures } from '../state/edit.actions';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from "@tailormap-viewer/shared";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: 'tm-edit-tool',
  templateUrl: './edit-tool.component.html',
  styleUrls: ['./edit-tool.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditToolComponent implements OnInit, OnDestroy {

  private static DEFAULT_ERROR_MESSAGE = $localize `Something went wrong while getting feature info, please try again`;
  private static DEFAULT_NO_FEATURES_FOUND_MESSAGE = $localize `No features found`;

  constructor(
    private mapService: MapService,
    private store$: Store,
    private destroyRef: DestroyRef,
    private snackBar: MatSnackBar,
  ) { }

  public ngOnInit(): void {
    this.mapService.createTool$<MapClickToolModel, MapClickToolConfigModel>({ type: ToolTypeEnum.MapClick })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(({ tool }) => {
          this.store$.dispatch(registerTool({ tool: { id: ToolbarComponentEnum.EDIT, mapToolId: tool.id } }));
        }),
        concatMap(({ tool }) => tool?.mapClick$ || of(null)),
      )
      .subscribe(mapClick => {
        this.handleMapClick(mapClick);
      });

    this.store$.select(selectEditActiveWithSelectedLayer)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(editActive => {
        if (editActive) {
          this.store$.dispatch(activateTool({ tool: ToolbarComponentEnum.EDIT }));
        } else {
          this.store$.dispatch(deactivateTool({ tool: ToolbarComponentEnum.EDIT }));
        }
      });
  }

  public ngOnDestroy() {
    this.store$.dispatch(deregisterTool({ tool: ToolbarComponentEnum.EDIT }));
  }

  private handleMapClick(evt: { mapCoordinates: [number, number]; mouseCoordinates: [number, number] }) {
    this.store$.dispatch(loadEditFeatures({ coordinates: evt.mapCoordinates }));
    this.store$.pipe(selectEditError$)
      .subscribe(error => {
          if (!error || error.error === 'none') {
              return;
          }
          const config: SnackBarMessageOptionsModel = {
              message: error.error === 'error'
                  ? error.errorMessage || EditToolComponent.DEFAULT_ERROR_MESSAGE
                  : EditToolComponent.DEFAULT_NO_FEATURES_FOUND_MESSAGE,
              duration: 5000,
              showDuration: true,
              showCloseButton: true,
          };
          SnackBarMessageComponent.open$(this.snackBar, config);
      });
  }

}
