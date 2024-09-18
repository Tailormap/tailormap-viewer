import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFilterableLayers } from '../../../map/state/map.selectors';
import { ExtendedAppLayerModel } from '../../../map/models';
import { Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { MapService } from '@tailormap-viewer/map';
import { FeatureStylingHelper } from '../../../shared/helpers/feature-styling.helper';
import {
  hasSelectedLayersAndGeometry, selectSelectedFilterGroupError, selectSelectedFilterGroupId, selectSelectedLayersCount,
} from '../state/filter-component.selectors';
import { closeForm } from '../state/filter-component.actions';
import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import { RemoveFilterService } from '../services/remove-filter.service';
import { SpatialFilterReferenceLayerService } from '../../../filter/services/spatial-filter-reference-layer.service';
import { filter } from 'rxjs/operators';
import { TypesHelper } from '@tailormap-viewer/shared';
import { ApplicationStyleService } from '../../../services/application-style.service';
import { FilterFeaturesService } from '../services/filter-features.service';

@Component({
  selector: 'tm-spatial-filter-form',
  templateUrl: './spatial-filter-form.component.html',
  styleUrls: ['./spatial-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpatialFilterFormComponent implements OnInit, OnDestroy {

  private DEFAULT_STYLE = (feature: FeatureModel) => FeatureStylingHelper.getDefaultHighlightStyle('filter-drawing-style', {
    pointType: undefined,
    fillColor: ApplicationStyleService.getPrimaryColor(),
    fillOpacity: 30,
    strokeWidth: 2,
    buffer: feature.attributes?.buffer,
  });

  private destroyed = new Subject();

  public drawingLayerId = 'filter-drawing-layer';
  public availableLayers$: Observable<ExtendedAppLayerModel[]> = of([]);

  public currentGroup$: Observable<string | undefined> = of(undefined);
  public selectedLayersCount$: Observable<number> = of(0);
  public hasSelectedLayersAndGeometry$: Observable<boolean> = of(false);
  public isLoadingReferenceGeometry$: Observable<boolean> = of(false);
  public currentGroupError$: Observable<string | undefined> = of(undefined);

  constructor(
    private store$: Store,
    private mapService: MapService,
    private removeFilterService: RemoveFilterService,
    private spatialFilterReferenceLayerService: SpatialFilterReferenceLayerService,
    private filterFeaturesService: FilterFeaturesService,
  ) {
  }

  public ngOnInit(): void {
    this.availableLayers$ = this.store$.select(selectFilterableLayers);
    this.selectedLayersCount$ = this.store$.select(selectSelectedLayersCount);
    this.hasSelectedLayersAndGeometry$ = this.store$.select(hasSelectedLayersAndGeometry);
    this.currentGroup$ = this.store$.select(selectSelectedFilterGroupId);
    this.currentGroupError$ = this.store$.select(selectSelectedFilterGroupError);
    this.isLoadingReferenceGeometry$ = this.currentGroup$
      .pipe(
        filter(TypesHelper.isDefined),
        switchMap(groupId => this.spatialFilterReferenceLayerService.isLoadingGeometryForGroup$(groupId)),
      );

    this.mapService.renderFeatures$<FeatureModelAttributes>(
      this.drawingLayerId,
      this.filterFeaturesService.getFilterFeatures$(),
      this.DEFAULT_STYLE,
    ).pipe(takeUntil(this.destroyed)).subscribe();
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public save() {
    this.store$.dispatch(closeForm());
  }

  public cancel() {
    this.store$.dispatch(closeForm());
  }

  public remove(groupId: string) {
    if (!groupId) {
      return;
    }
    this.removeFilterService.removeFilter$(groupId)
      .subscribe((removed) => {
        if (removed) {
          this.store$.dispatch(closeForm());
        }
      });
  }

}
