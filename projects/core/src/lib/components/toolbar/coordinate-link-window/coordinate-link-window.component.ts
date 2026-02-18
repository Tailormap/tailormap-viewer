import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject, OnDestroy, input } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  CoordinateHelper, MapClickToolConfigModel, MapClickToolModel, MapService, ToolTypeEnum,
} from '@tailormap-viewer/map';
import { selectComponentsConfigForType } from '../../../state/core.selectors';
import {
  BaseComponentTypeEnum, CoordinateLinkWindowConfigModel, CoordinateLinkWindowConfigUrlModel,
} from '@tailormap-viewer/api';
import { combineLatest, concatMap, filter, map, Observable, of, switchMap, tap } from 'rxjs';
import { FormControl } from '@angular/forms';
import { take } from 'rxjs/operators';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  TerrainControlsMenuButtonComponent
} from '../terrain-controls/terrain-controls-menu-button/terrain-controls-menu-button.component';
import { ComponentRegistrationService } from '../../../services';
import { CoordinateLinkWindowMenuButtonComponent } from './coordinate-link-window-menu-button/coordinate-link-window-menu-button.component';
import { MenubarService } from '../../menubar';
import { MobileLayoutService } from '../../../services/viewer-layout/mobile-layout.service';

@Component({
  selector: 'tm-coordinate-link-window',
  templateUrl: './coordinate-link-window.component.html',
  styleUrls: ['./coordinate-link-window.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CoordinateLinkWindowComponent implements OnInit, OnDestroy {
  private store$ = inject(Store);
  private mapService = inject(MapService);
  private destroyRef = inject(DestroyRef);
  private componentRegistrationService = inject(ComponentRegistrationService);
  private menubarService = inject(MenubarService);
  private mobileLayoutService = inject(MobileLayoutService);


  public noExpansionPanel = input<boolean>(false);

  public toolActive = toSignal(this.mapService.someToolsEnabled$([BaseComponentTypeEnum.COORDINATE_LINK_WINDOW]));
  public urls$: Observable<CoordinateLinkWindowConfigUrlModel[]>;
  public title$: Observable<string>;
  private tool: string | undefined;
  public visible$ = combineLatest([
    this.menubarService.isComponentVisible$(BaseComponentTypeEnum.COORDINATE_LINK_WINDOW),
    this.mobileLayoutService.isMobileLayoutEnabled$,
  ]).pipe(
    takeUntilDestroyed(this.destroyRef),
    map(([ visible, mobileLayoutEnabled ]) => visible || !mobileLayoutEnabled),
  );

  public urlControl = new FormControl<CoordinateLinkWindowConfigUrlModel | null>(null);

  constructor() {
    const config$ = this.store$.select(selectComponentsConfigForType<CoordinateLinkWindowConfigModel>(BaseComponentTypeEnum.COORDINATE_LINK_WINDOW))
      .pipe(map(config => config?.config));
    this.urls$ = config$.pipe(map(conf => conf?.urls || []));
    this.title$ = config$.pipe(map(conf => conf?.title || $localize `:@@core.coordinate-link-window.title:Coordinate Link Window`));
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

    this.componentRegistrationService.registerComponent('mobile-menu-home', { type: BaseComponentTypeEnum.COORDINATE_LINK_WINDOW, component: CoordinateLinkWindowMenuButtonComponent });
  }

  public toggle(close?: boolean) {
    if (close === true || this.toolActive()) {
      this.mapService.disableTool(this.tool);
      return;
    }
    this.mapService.enableTool(this.tool, true);
  }

  private createMapClickTool() {
    this.mapService.createTool$<MapClickToolModel, MapClickToolConfigModel>({
      type: ToolTypeEnum.MapClick,
      owner: BaseComponentTypeEnum.COORDINATE_LINK_WINDOW,
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(({ tool }) => {
          this.tool = tool.id;
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

  public ngOnDestroy() {
    this.componentRegistrationService.deregisterComponent('mobile-menu-home', BaseComponentTypeEnum.COORDINATE_LINK_WINDOW);
  }

}
