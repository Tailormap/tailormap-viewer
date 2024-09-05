import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { MapClickToolConfigModel, MapClickToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { combineLatest, concatMap, mergeMap, of, Subject, takeUntil, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { loadFeatureInfo, featureInfoLoaded } from '../state/feature-info.actions';
import { selectCurrentlySelectedFeatureGeometry, selectLoadingFeatureInfo, selectMapCoordinates } from '../state/feature-info.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { deregisterTool, registerTool } from '../../toolbar/state/toolbar.actions';
import { ToolbarComponentEnum } from '../../toolbar/models/toolbar-component.enum';
import { FeatureStylingHelper } from '../../../shared/helpers/feature-styling.helper';
import { selectVisibleLayersWithAttributes, selectVisibleWMSLayersWithoutAttributes } from '../../../map/state/map.selectors';
import { take } from 'rxjs/operators';
import { FeatureInfoLayerModel } from '../models/feature-info-layer.model';
import { FeatureInfoService } from '../feature-info.service';
import { selectViewerId } from '../../../state/core.selectors';

@Component({
  selector: 'tm-feature-info',
  templateUrl: './feature-info.component.html',
  styleUrls: ['./feature-info.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  private handleMapClick(evt: { mapCoordinates: [number, number]; mouseCoordinates: [number, number] }) {
    combineLatest([
      this.store$.select(selectVisibleLayersWithAttributes),
      this.store$.select(selectVisibleWMSLayersWithoutAttributes),
      this.store$.select(selectViewerId),
      this.mapService.getMapViewDetails$(),
    ])
      .pipe(
        take(1),
        tap(([ layers, wmsLayers ]) => {
          const featureInfoLayers = [ ...layers, ...wmsLayers ]
            .sort((l1, l2) => l1.title.localeCompare(l2.title))
            .map<FeatureInfoLayerModel>(l => ({
              id: l.id,
              title: l.title,
              loading: LoadingStateEnum.LOADING,
            }));
          this.store$.dispatch(loadFeatureInfo({ mapCoordinates: evt.mapCoordinates, mouseCoordinates: evt.mouseCoordinates, layers: featureInfoLayers }));
        }),
        mergeMap(([ layers, wmsLayers, viewerId, mapViewDetails ]) => {
          if (!viewerId) {
            return [];
          }
          return [
            ...layers.map(l => this.featureInfoService.getFeatureInfoFromApi$(l.id, evt.mapCoordinates, viewerId, mapViewDetails)),
            ...wmsLayers.map(l => this.featureInfoService.getWmsGetFeatureInfo$(l.id, evt.mapCoordinates)),
          ];
        }),
        mergeMap(featureInfoRequests$ => featureInfoRequests$),
      )
      .subscribe(response => {
        this.store$.dispatch(featureInfoLoaded({ featureInfo: response }));
      });
  }

}
