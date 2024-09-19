import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { CoordinateHelper, MapClickToolConfigModel, MapClickToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { selectComponentsConfigForType } from '../../../state/core.selectors';
import {
  BaseComponentTypeEnum, CoordinateLinkWindowConfigModel, CoordinateLinkWindowConfigUrlModel,
} from '@tailormap-viewer/api';
import { concatMap, filter, map, Observable, of, switchMap, tap } from 'rxjs';
import { FormControl } from '@angular/forms';
import { take } from 'rxjs/operators';
import { deactivateTool, deregisterTool, registerTool, toggleTool } from '../state/toolbar.actions';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isActiveToolbarTool } from '../state/toolbar.selectors';
import { selectIn3DView } from '../../../map/state/map.selectors';

@Component({
  selector: 'tm-coordinate-link-window',
  templateUrl: './coordinate-link-window.component.html',
  styleUrls: ['./coordinate-link-window.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinateLinkWindowComponent implements OnInit, OnDestroy {

  public toolActive$: Observable<boolean>;
  public urls$: Observable<CoordinateLinkWindowConfigUrlModel[]>;
  public title$: Observable<string>;
  public in3DView$: Observable<boolean>;

  public urlControl = new FormControl<CoordinateLinkWindowConfigUrlModel | null>(null);

  constructor(
    private store$: Store,
    private mapService: MapService,
    private destroyRef: DestroyRef,
  ) {
    const config$ = this.store$.select(selectComponentsConfigForType<CoordinateLinkWindowConfigModel>(BaseComponentTypeEnum.COORDINATE_LINK_WINDOW))
      .pipe(map(config => config?.config));
    this.urls$ = config$.pipe(map(conf => conf?.urls || []));
    this.title$ = config$.pipe(map(conf => conf?.title || $localize `:@@core.coordinate-link-window.title:Coordinate Link Window`));
    this.toolActive$ = this.store$.select(isActiveToolbarTool(ToolbarComponentEnum.COORDINATE_LINK_WINDOW));
    this.in3DView$ = this.store$.select(selectIn3DView);
  }

  public ngOnInit(): void {
    this.urls$
      .pipe(
        filter(urls => !!urls && urls.length > 0),
        take(1),
      )
      .subscribe(urls => {
        if (urls && urls.length > 0) {
          this.urlControl.patchValue(urls[0]);
          this.createMapClickTool();
        }
      });
  }

  public ngOnDestroy() {
    this.store$.dispatch(deregisterTool({ tool: ToolbarComponentEnum.COORDINATE_LINK_WINDOW }));
  }

  public toggle(close?: boolean) {
    if (close === true) {
      this.store$.dispatch(deactivateTool({ tool: ToolbarComponentEnum.COORDINATE_LINK_WINDOW }));
      return;
    }
    this.store$.dispatch(toggleTool({ tool: ToolbarComponentEnum.COORDINATE_LINK_WINDOW }));
  }

  private createMapClickTool() {
    this.mapService.createTool$<MapClickToolModel, MapClickToolConfigModel>({
      type: ToolTypeEnum.MapClick,
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(({ tool }) => {
          this.store$.dispatch(registerTool({ tool: { id: ToolbarComponentEnum.COORDINATE_LINK_WINDOW, mapToolId: tool.id } }));
        }),
        concatMap(({ tool }) => tool.mapClick$),
        switchMap(({ mapCoordinates }) => {
          const currentUrl = this.urlControl.value;
          if (!currentUrl || !currentUrl.projection) {
            return of(mapCoordinates);
          }
          return this.mapService.getProjectionCode$()
            .pipe(take(1), map(mapProjection => {
              return CoordinateHelper.projectCoordinates(mapCoordinates, mapProjection, currentUrl.projection);
            }));
        }),
      ).subscribe(coordinates => {
        const currentUrl = this.urlControl.value;
        if (!currentUrl || !currentUrl.url || !coordinates || coordinates.length < 2) {
          return;
        }
        const replaced = currentUrl.url
          .replace(/\[(x|lon)]/i, "" + coordinates[0])
          .replace(/\[(y|lat)]/i, "" + coordinates[1]);
        window.open(replaced, '_blank', 'popup=1, noopener, noreferrer');
      },
    );
  }

}
