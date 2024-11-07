import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import * as ToolbarActions from './toolbar.actions';
import { map, of, switchMap, take, tap } from 'rxjs';
import { MapCursorHelper, MapService } from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { isActiveToolbarTool, selectActiveTool, selectToolbarTool } from './toolbar.selectors';
import { Injectable } from '@angular/core';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';

@Injectable()
export class ToolbarEffects {

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
        if (!tool) {
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
        const crossHairTools = [ ToolbarComponentEnum.COORDINATE_LINK_WINDOW, ToolbarComponentEnum.SELECT_COORDINATES, ToolbarComponentEnum.STREETVIEW ];
        MapCursorHelper.setCrosshairCursor(!!tool && crossHairTools.includes(tool));
      }),
    );
  }, { dispatch: false });

  constructor(
    private actions$: Actions,
    private store$: Store,
    private mapService: MapService,
  ) {}

}
