import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FeatureInfo3DModel, MapClickToolConfigModel, MapClickToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { combineLatest, concatMap, filter, of, Subject, takeUntil, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { add3DLayerToFeatureInfoLayers, featureInfoLoaded } from '../state/feature-info.actions';
import { selectCurrentlySelectedFeatureGeometry, selectLoadingFeatureInfo, selectMapCoordinates } from '../state/feature-info.selectors';
import { deregisterTool, registerTool } from '../../toolbar/state/toolbar.actions';
import { ToolbarComponentEnum } from '../../toolbar/models/toolbar-component.enum';
import { FeatureStylingHelper } from '../../../shared/helpers/feature-styling.helper';
import { FeatureInfoService } from '../feature-info.service';
import {
  select3dTilesLayers, selectIn3DView, selectLayer, selectVisibleLayersWithAttributes, selectVisibleWMSLayersWithoutAttributes,
} from '../../../map/state/map.selectors';
import { take } from 'rxjs/operators';
import { FeatureInfoResponseModel } from '../models/feature-info-response.model';
import { FeatureInfoFeatureModel } from '../models/feature-info-feature.model';
import { FeatureInfoLayerModel } from '../models/feature-info-layer.model';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { FeatureModelAttributes } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-feature-info',
  templateUrl: './feature-info.component.html',
  styleUrls: ['./feature-info.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FeatureInfoComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();

  public loadingFeatureInfo$ = this.store$.select(selectLoadingFeatureInfo);
  public featureInfoCoordinates$ = this.store$.select(selectMapCoordinates);

  private static DEFAULT_ERROR_MESSAGE = $localize `:@@core.feature-info.error-loading-feature-info:Something went wrong while getting feature info, please try again`;
  private static DEFAULT_NO_FEATURES_FOUND_MESSAGE = $localize `:@@core.feature-info.no-features-found:No features found`;

  constructor(
    private mapService: MapService,
    private featureInfoService: FeatureInfoService,
    private store$: Store,
  ) { }

  public ngOnInit(): void {
    this.mapService.createTool$<MapClickToolModel, MapClickToolConfigModel>({ type: ToolTypeEnum.MapClick, autoEnable: true })
      .pipe(
        takeUntil(this.destroyed),
        tap(({ tool }) => {
          this.store$.dispatch(registerTool({ tool: { id: ToolbarComponentEnum.FEATURE_INFO, mapToolId: tool.id } }));
        }),
        concatMap(({ tool }) => tool?.mapClick$ || of(null)),
      )
      .subscribe(mapClick => {
        this.handleMapClick(mapClick);
      });

    this.mapService.renderFeatures$(
      'feature-info-highlight-layer',
      this.store$.select(selectCurrentlySelectedFeatureGeometry),
      FeatureStylingHelper.getDefaultHighlightStyle('feature-info-highlight-style'),
    )
      .pipe(takeUntil(this.destroyed))
      .subscribe();
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
    this.store$.dispatch(deregisterTool({ tool: ToolbarComponentEnum.FEATURE_INFO }));
  }

  private handleMapClick(evt: { mapCoordinates: [number, number]; mouseCoordinates: [number, number]; cesiumFeatureInfo?: FeatureInfo3DModel }) {
    combineLatest([
      this.store$.select(selectVisibleLayersWithAttributes),
      this.store$.select(selectVisibleWMSLayersWithoutAttributes),
      this.store$.select(select3dTilesLayers),
      this.store$.select(selectIn3DView),
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
          return this.featureInfoService.fetchFeatures$(evt.mapCoordinates, evt.mouseCoordinates);
        }),
        tap(() => {
          this.store$.select(selectIn3DView).pipe(take(1)).subscribe(in3DView => {
            if (in3DView && evt.cesiumFeatureInfo) {
              this.store$.dispatch(featureInfoLoaded({ featureInfo: this.featureInfo3DToResponse(evt.cesiumFeatureInfo) }));
            }
          });
        }),
      )
      .subscribe(response => {
        if (response === null) {
          return;
        }
        this.store$.dispatch(featureInfoLoaded({ featureInfo: response }));
      });
  }

  private featureInfo3DToResponse(cesiumFeatureInfo: FeatureInfo3DModel): FeatureInfoResponseModel {
    let layerId: string | null = null;
    this.mapService.getCesiumLayerManager$().pipe(take(1)).subscribe(cesiumLayerManager => {
      if (cesiumFeatureInfo) {
        layerId = cesiumLayerManager.getLayerId(cesiumFeatureInfo.primitiveIndex);
      }
    });
    cesiumFeatureInfo.layerId = layerId ?? '';

    this.store$.select(selectLayer(cesiumFeatureInfo.layerId)).pipe(take(1)).subscribe(layer => {
      if (layer) {
        const featureInfoLayer: FeatureInfoLayerModel = { id: layer.id, title: layer.title, loading: LoadingStateEnum.LOADING };
        this.store$.dispatch(add3DLayerToFeatureInfoLayers({ layer: featureInfoLayer }));
      }
    });

    const feature: FeatureInfoFeatureModel = {
      __fid: cesiumFeatureInfo.featureId.toString(),
      attributes: cesiumFeatureInfo.properties.reduce(
        (acc, { id, value }) => {
          acc[id] = value;
          return acc;
        },
        {} as FeatureModelAttributes,
      ),
      layerId: cesiumFeatureInfo.layerId,
    };

    return {
        features: [feature],
        columnMetadata: cesiumFeatureInfo.columnMetadata,
        layerId: cesiumFeatureInfo.layerId,
    };

  }

}
