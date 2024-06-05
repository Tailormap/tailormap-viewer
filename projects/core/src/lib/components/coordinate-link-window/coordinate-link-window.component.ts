import { Component, OnInit, ChangeDetectionStrategy, signal, DestroyRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { CoordinateHelper, MapClickToolConfigModel, MapClickToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { selectComponentsConfigForType } from '../../state/core.selectors';
import {
  BaseComponentTypeEnum, CoordinateLinkWindowConfigModel, CoordinateLinkWindowConfigUrlModel,
} from '@tailormap-viewer/api';
import { concatMap, filter, map, Observable, pipe, switchMap, takeUntil, tap } from 'rxjs';
import { FormControl } from '@angular/forms';
import { take } from 'rxjs/operators';
import { activateTool, deactivateTool, deregisterTool, registerTool, toggleTool } from '../toolbar/state/toolbar.actions';
import { ToolbarComponentEnum } from '../toolbar/models/toolbar-component.enum';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { coordinates } from 'ol/geom/flat/reverse';

@Component({
  selector: 'tm-coordinate-link-window',
  templateUrl: './coordinate-link-window.component.html',
  styleUrls: ['./coordinate-link-window.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinateLinkWindowComponent implements OnInit {

  public active = signal(false);
  public urls$: Observable<CoordinateLinkWindowConfigUrlModel[]>;
  public title$: Observable<string>;

  public urlControl = new FormControl<string>('');

  constructor(
    private store$: Store,
    private mapService: MapService,
    private destroyRef: DestroyRef,
  ) {
    const config$ = this.store$.select(selectComponentsConfigForType<CoordinateLinkWindowConfigModel>(BaseComponentTypeEnum.COORDINATE_LINK_WINDOW))
      .pipe(map(config => config?.config));
    this.urls$ = config$.pipe(map(conf => conf?.urls || []));
    this.title$ = config$.pipe(map(conf => conf?.title || 'Coordinate Link Window'));

  }

  public ngOnInit(): void {
    this.urls$
      .pipe(
        filter(urls => !!urls && urls.length > 0),
        take(1),
      )
      .subscribe(urls => {
        if (urls && urls.length > 0) {
          this.urlControl.patchValue(urls[0].url);
        }
      });
    this.createMapClickTool();
  }

  public ngOnDestroy() {
    this.store$.dispatch(deregisterTool({ tool: ToolbarComponentEnum.COORDINATE_LINK_WINDOW }));
  }

  public toggle(close?: boolean) {
    const active = close ? false : !this.active();
    this.active.set(active);
    if (active) {
      this.store$.dispatch(activateTool({ tool: ToolbarComponentEnum.COORDINATE_LINK_WINDOW }));
    } else {
      this.store$.dispatch(deactivateTool({ tool: ToolbarComponentEnum.COORDINATE_LINK_WINDOW }));
    }
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
        // this.mapService.getProjectionCode$()
        // get map projection
        // project to target
      ).subscribe(mapClick => {
        const currentUrl = this.urlControl.value;
        if (!currentUrl) {
          return;
        }
        CoordinateHelper.projectCoordinates(mapClick.mapCoordinates, )
        const replaced = currentUrl.replace('[X]', coordinates[0]).replace('[Y]', coordinates[1]);
        window.open(replaced, '_blank');
      },
    );
  }

}
