import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, DestroyRef } from '@angular/core';
import { FeatureInfo3DModel, MapClickToolConfigModel, MapClickToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { combineLatest, concatMap, filter, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { featureInfoLoaded, hideFeatureInfoDialog } from '../state/feature-info.actions';
import {
  selectCurrentlySelectedFeatureGeometry, selectFeatureInfoDialogVisible, selectFeatureInfoFeatures, selectLoadingFeatureInfo,
  selectMapCoordinates,
} from '../state/feature-info.selectors';
import { deregisterTool, registerTool } from '../../toolbar/state/toolbar.actions';
import { ToolbarComponentEnum } from '../../toolbar/models/toolbar-component.enum';
import { FeatureStylingHelper } from '../../../shared/helpers/feature-styling.helper';
import { FeatureInfoService } from '../feature-info.service';
import {
  select3dTilesLayers, selectIn3dView, selectVisibleLayersWithAttributes, selectVisibleWMSLayersWithoutAttributes,
} from '../../../map/state/map.selectors';
import { take, withLatestFrom } from 'rxjs/operators';
import { FeatureUpdatedService } from '../../../services';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-feature-info',
  templateUrl: './feature-info.component.html',
  styleUrls: ['./feature-info.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FeatureInfoComponent implements OnInit, OnDestroy {
  private mapService = inject(MapService);
  private featureInfoService = inject(FeatureInfoService);
  private store$ = inject(Store);
  private featureUpdatedService = inject(FeatureUpdatedService);
  private destroyRef = inject(DestroyRef);

  private destroyed = new Subject();

  public loadingFeatureInfo$ = this.store$.select(selectLoadingFeatureInfo);
  public featureInfoCoordinates$ = this.store$.select(selectMapCoordinates);

  private static DEFAULT_ERROR_MESSAGE = $localize `:@@core.feature-info.error-loading-feature-info:Something went wrong while getting feature info, please try again`;
  private static DEFAULT_NO_FEATURES_FOUND_MESSAGE = $localize `:@@core.feature-info.no-features-found:No features found`;

  private clickTool: MapClickToolModel | undefined;

  public ngOnInit(): void {
    this.mapService.createTool$<MapClickToolModel, MapClickToolConfigModel>({ type: ToolTypeEnum.MapClick, autoEnable: true })
      .pipe(
        takeUntil(this.destroyed),
        tap(({ tool }) => {
          this.clickTool = tool;
          this.store$.dispatch(registerTool({ tool: { id: ToolbarComponentEnum.FEATURE_INFO, mapToolId: tool.id } }));
        }),
        concatMap(({ tool }) => tool?.mapClick$ || of(null)),
      )
      .subscribe(mapClick => {
        this.handleMapClick(mapClick);
      });

    this.mapService.getToolManager$().pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(toolManager => toolManager.getToolsDisabled$()),
      withLatestFrom(this.store$.select(selectFeatureInfoDialogVisible)),
    ).subscribe(([{ disabledTools }, featureInfoDialogVisible ]) => {
      if (this.clickTool && disabledTools.includes(this.clickTool.id) && featureInfoDialogVisible) {
        this.store$.dispatch(hideFeatureInfoDialog());
      }
    });

    this.mapService.renderFeatures$(
      'feature-info-highlight-layer',
      this.store$.select(selectCurrentlySelectedFeatureGeometry),
      FeatureStylingHelper.getDefaultHighlightStyle('feature-info-highlight-style'),
    )
      .pipe(takeUntil(this.destroyed))
      .subscribe();

    this.featureUpdatedService.featureUpdated$
      .pipe(
        takeUntil(this.destroyed),
        withLatestFrom(this.store$.select(selectFeatureInfoFeatures)),
      )
      .subscribe(([ updatedFeature, features ]) => {
        const updatedFeatureInFeatureInfo = features.find(f => f.__fid === updatedFeature.featureId);
        if (updatedFeatureInFeatureInfo) {
          this.featureInfoService.updateSingleFeature(updatedFeatureInFeatureInfo.__fid, updatedFeatureInFeatureInfo.layerId);
        }
      });

  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
    this.store$.dispatch(deregisterTool({ tool: ToolbarComponentEnum.FEATURE_INFO }));
  }

  private handleMapClick(evt: {
    mapCoordinates: [number, number]; mouseCoordinates: [number, number]; cesiumFeatureInfo?: FeatureInfo3DModel; pointerType?: string;
  }) {
    combineLatest([
      this.store$.select(selectVisibleLayersWithAttributes),
      this.store$.select(selectVisibleWMSLayersWithoutAttributes),
      this.store$.select(select3dTilesLayers),
      this.store$.select(selectIn3dView),
    ])
      .pipe(
        take(1),
        filter(([ layers, wmsLayers, tiles3dLayers, in3DView ]) => {
          if (in3DView) {
            return layers.length > 0 || wmsLayers.length > 0 || tiles3dLayers.length > 0;
          }
          return layers.length > 0 || wmsLayers.length > 0;
        }),
        concatMap(() => {
          return this.featureInfoService.fetchFeatures$(evt.mapCoordinates, evt.mouseCoordinates, evt.cesiumFeatureInfo, evt.pointerType);
        }),
      )
      .subscribe(response => {
        if (response === null) {
          return;
        }
        this.store$.dispatch(featureInfoLoaded({ featureInfo: response }));
      });
  }

}
