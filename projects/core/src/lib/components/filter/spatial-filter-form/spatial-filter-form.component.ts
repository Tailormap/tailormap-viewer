import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFilterableLayers } from '../../../map/state/map.selectors';
import { ExtendedAppLayerModel } from '../../../map/models';
import { BehaviorSubject, map, Observable, of, Subject, take, takeUntil } from 'rxjs';
import { FormControl } from '@angular/forms';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import { DrawingToolEvent, MapService } from '@tailormap-viewer/map';
import { nanoid } from 'nanoid';
import { SpatialFilterGeometry, SpatialFilterModel } from '../../../filter/models/spatial-filter.model';
import { FeatureStylingHelper } from '../../../shared/helpers/feature-styling.helper';
import { addFilterGroup, updateFilterGroup } from '../../../filter/state/filter.actions';
import { selectSelectedFilterGroup } from '../state/filter-component.selectors';
import { FilterGroupModel } from '../../../filter/models/filter-group.model';
import { FilterTypeHelper } from '../../../filter/helpers/filter-type.helper';
import { closeForm, setSelectedFilterGroup } from '../state/filter-component.actions';
import { CreateFilterService } from '../services/create-filter.service';
import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import { RemoveFilterService } from '../services/remove-filter.service';

@Component({
  selector: 'tm-spatial-filter-form',
  templateUrl: './spatial-filter-form.component.html',
  styleUrls: ['./spatial-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpatialFilterFormComponent implements OnInit, OnDestroy {

  private DEFAULT_STYLE = FeatureStylingHelper.getDefaultHighlightStyle('filter-drawing-style', {
    pointType: undefined,
    fillColor: '#6236ff',
    fillOpacity: 10,
    strokeWidth: 2,
  });

  private SELECTED_STYLE = () => FeatureStylingHelper.getDefaultHighlightStyle('filter-selected-style', {
    ...this.DEFAULT_STYLE,
    isSelected: true,
  });

  private store$ = inject(Store);
  private mapService = inject(MapService);
  private createFilterService = inject(CreateFilterService);
  private removeFilterService = inject(RemoveFilterService);

  private destroyed = new Subject();

  public drawingLayerId = 'filter-drawing-layer';
  public availableLayers$: Observable<ExtendedAppLayerModel[]> = of([]);
  public allowedGeometryTypes: DrawingFeatureTypeEnum[] = [
    DrawingFeatureTypeEnum.LINE,
    DrawingFeatureTypeEnum.POLYGON,
    DrawingFeatureTypeEnum.CIRCLE,
  ];
  public selectedStyle = this.SELECTED_STYLE;

  public selectedLayers = new FormControl<number[]>([], {
    nonNullable: true,
  });
  private geometriesSubject$ = new BehaviorSubject<SpatialFilterGeometry[]>([]);
  private geometries$ = this.geometriesSubject$.asObservable();
  private drawingFeatures$: Observable<FeatureModel[]> = this.geometries$
    .pipe(map(geometries => {
      return geometries.map<FeatureModel>(geom => ({
        __fid: geom.id,
        geometry: geom.geometry,
        attributes: {},
      }));
    }));
  public currentGroup: FilterGroupModel<SpatialFilterModel> | undefined;

  public ngOnInit(): void {
    this.availableLayers$ = this.store$.select(selectFilterableLayers);

    this.store$.select(selectSelectedFilterGroup)
      .pipe(takeUntil(this.destroyed))
      .subscribe(group => {
        this.setForm(group);
      });

    this.mapService.renderFeatures$<FeatureModelAttributes>(
      this.drawingLayerId,
      this.drawingFeatures$,
      this.DEFAULT_STYLE,
    ).pipe(takeUntil(this.destroyed)).subscribe();

    this.selectedLayers.valueChanges
      .pipe(takeUntil(this.destroyed))
      .subscribe((layers) => this.updateCreateGroup(layers, this.geometriesSubject$.value));
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public drawingAdded($event: DrawingToolEvent) {
    const currentGeometries = this.geometriesSubject$.value;
    const updatedGeometries = [ ...currentGeometries, { id: nanoid(), geometry: $event.geometry }];
    this.geometriesSubject$.next(updatedGeometries);
    this.updateCreateGroup(this.selectedLayers.value, updatedGeometries);
  }

  public featureRemoved($event: string) {
    const currentGeometries = this.geometriesSubject$.value;
    const updatedGeometries = currentGeometries.filter(geom => geom.id !== $event);
    this.geometriesSubject$.next(updatedGeometries);
    this.updateCreateGroup(this.selectedLayers.value, updatedGeometries);
  }

  public save() {
    this.store$.dispatch(closeForm());
  }

  public cancel() {
    this.store$.dispatch(closeForm());
  }

  public remove() {
    if (!this.currentGroup) {
      return;
    }
    this.removeFilterService.removeFilter$(this.currentGroup.id)
      .subscribe((removed) => {
        if (removed) {
          this.store$.dispatch(closeForm());
        }
      });
  }

  private setForm(group?: FilterGroupModel) {
    if (!FilterTypeHelper.isSpatialFilterGroup(group)) {
      this.currentGroup = undefined;
      this.selectedLayers.patchValue([], { emitEvent: false });
      this.geometriesSubject$.next([]);
      return;
    }
    const geometries = group.filters.reduce<SpatialFilterGeometry[]>((g, filter) => {
      return [ ...g, ...filter.geometries ];
    }, []);
    this.currentGroup = group;
    this.geometriesSubject$.next(geometries);
    this.selectedLayers.patchValue(group.layerIds, { emitEvent: false });
  }

  private updateCreateGroup(layers: number[], geometries: SpatialFilterGeometry[]) {
    if (layers.length === 0 || geometries.length === 0) {
      return;
    }
    if (!this.currentGroup) {
      this.createFilterService.createSpatialFilterGroup$(geometries || [], layers)
        .pipe(take(1))
        .subscribe(group => {
          this.store$.dispatch(addFilterGroup({ group }));
          this.store$.dispatch(setSelectedFilterGroup({ id: group.id }));
        });
      return;
    }
    this.createFilterService.updateSpatialFilterGroup$(this.currentGroup, geometries, layers)
      .pipe(take(1))
      .subscribe(updatedFilterGroup => {
        this.store$.dispatch(updateFilterGroup({ filterGroup: updatedFilterGroup }));
      });
  }

}
