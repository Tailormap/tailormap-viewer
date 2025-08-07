import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import * as ToolbarActions from './toolbar.actions';
import { map, of, switchMap, take, tap } from 'rxjs';
import { MapCursorHelper, MapService } from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { isActiveToolbarTool, selectActiveTool, selectToolbarTool, selectTools } from './toolbar.selectors';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { withLatestFrom } from 'rxjs/operators';

@Injectable()
export class ToolbarEffects {
  private actions$ = inject(Actions);
  private store$ = inject(Store);
  private mapService = inject(MapService);
  private destroyRef = inject(DestroyRef);


  public toggleTool$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ToolbarActions.toggleTool),
      concatLatestFrom(action => this.store$.select(isActiveToolbarTool(action.tool))),
      map(([ action, isActive ]) => {
        if (isActive) {
          return ToolbarActions.deactivateTool({ tool: action.tool });
        }
        return ToolbarActions.activateTool({ tool: action.tool, enableArguments: action.enableArguments });
      }),
    );
  });

  public activateTool$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ToolbarActions.activateTool),
      concatLatestFrom(action => this.store$.select(selectToolbarTool(action.tool))),
      switchMap(([ action, tool ]) => {
        if (!tool || action.preventMapToolActivation) {
          return of(null);
        }
        return this.mapService.getToolManager$()
          .pipe(
            take(1),
            tap(manager => {
              if (tool.mapToolId) {
                manager.enableTool(tool.mapToolId, true, action.enableArguments);
              }
            }),
          );
      }),
    );
  }, { dispatch: false });

  public deactivateTool$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ToolbarActions.deactivateTool),
      concatLatestFrom(action => this.store$.select(selectToolbarTool(action.tool))),
      switchMap(([ _, tool ]) => {
        if (!tool) {
          return of(null);
        }
        return this.mapService.getToolManager$()
          .pipe(
            take(1),
            tap(manager => {
              if (tool.mapToolId) {
                manager.disableTool(tool.mapToolId);
              }
            }),
          );
      }),
    );
  }, { dispatch: false });

  public setCrosshairCursorOnMap$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ToolbarActions.activateTool, ToolbarActions.deactivateTool),
      concatLatestFrom(() => this.store$.select(selectActiveTool)),
      tap(([ _action, tool ]) => {
        const crosshairTools = [ ToolbarComponentEnum.COORDINATE_LINK_WINDOW, ToolbarComponentEnum.SELECT_COORDINATES, ToolbarComponentEnum.STREETVIEW ];
        MapCursorHelper.setCrosshairCursor(!!tool && crosshairTools.includes(tool));
      }),
    );
  }, { dispatch: false });

  constructor() {
    this.mapService.getToolManager$()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(toolManager => toolManager.getToolsDisabled$()),
        withLatestFrom(this.store$.select(selectTools), this.store$.select(selectActiveTool)),
      )
      .subscribe(([{ disabledTools, enabledTools }, allTools, activeTool ]) => {
        const activeMapToolId = allTools.find(tool => tool.id === activeTool)?.mapToolId;
        if (activeTool && activeMapToolId && disabledTools.includes(activeMapToolId) && !enabledTools.includes(activeMapToolId)) {
          this.store$.dispatch(ToolbarActions.deactivateToolButtonOnly({ tool: activeTool }));
        }
      });
  }

}
