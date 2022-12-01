import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFilterableLayers } from '../../../map/state/map.selectors';
import { ExtendedAppLayerModel } from '../../../map/models';
import { BehaviorSubject, combineLatest, map, Observable, of, Subject, take, takeUntil } from 'rxjs';
import { FormControl } from '@angular/forms';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import { DrawingToolEvent, MapService } from '@tailormap-viewer/map';
import { nanoid } from 'nanoid';
import { DrawingFeatureModelAttributes } from '../../drawing/models/drawing-feature.model';
import { SpatialFilterGeometry, SpatialFilterModel } from '../../../filter/models/spatial-filter.model';
import { FeatureStylingHelper } from '../../../shared/helpers/feature-styling.helper';
import { addFilterGroup, removeFilterGroup, updateFilterGroup } from '../../../filter/state/filter.actions';
import { selectSelectedFilterGroup } from '../state/filter-component.selectors';
import { FilterGroupModel } from '../../../filter/models/filter-group.model';
import { FilterTypeHelper } from '../../../filter/helpers/filter-type.helper';
import { closeForm, setSelectedFilterGroup } from '../state/filter-component.actions';
import { CreateFilterService } from '../services/create-filter.service';

@Component({
  selector: 'tm-spatial-filter-form',
  templateUrl: './spatial-filter-form.component.html',
  styleUrls: ['./spatial-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpatialFilterFormComponent implements OnInit, OnDestroy {

  private store$ = inject(Store);
  private mapService = inject(MapService);
  private createFilterService = inject(CreateFilterService);

  private destroyed = new Subject();

  public drawingLayerId = 'filter-drawing-layer';
  public availableLayers$: Observable<ExtendedAppLayerModel[]> = of([]);
  public allowedGeometryTypes: DrawingFeatureTypeEnum[] = [
    DrawingFeatureTypeEnum.LINE,
    DrawingFeatureTypeEnum.POLYGON,
    DrawingFeatureTypeEnum.CIRCLE,
  ];

  public selectedLayers = new FormControl<number[]>([], {
    nonNullable: true,
  });
  private geometries$ = new BehaviorSubject<SpatialFilterGeometry[]>([]);
  private drawingFeatures$: Observable<string[]> = this.geometries$.asObservable()
    .pipe(map(geometries => geometries.map(geom => geom.geometry)));
  public currentGroup: FilterGroupModel<SpatialFilterModel> | undefined;
  private updatingForm = false;

  public ngOnInit(): void {
    this.availableLayers$ = this.store$.select(selectFilterableLayers);

    this.store$.select(selectSelectedFilterGroup)
      .pipe(takeUntil(this.destroyed))
      .subscribe(group => {
        this.setForm(group);
      });

    this.mapService.renderFeatures$<DrawingFeatureModelAttributes>(
      this.drawingLayerId,
      this.drawingFeatures$,
      FeatureStylingHelper.getDefaultHighlightStyle('filter-drawing-style'),
    ).pipe(takeUntil(this.destroyed)).subscribe();

    combineLatest([
      this.selectedLayers.valueChanges,
      this.geometries$.asObservable(),
    ]).pipe(takeUntil(this.destroyed)).subscribe(([ layers, geometries ]) => this.updateCreateGroup(layers, geometries));
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public drawingAdded($event: DrawingToolEvent) {
    this.geometries$.next(this.geometries$.value.concat({
      id: nanoid(),
      geometry: $event.geometry,
    }));
  }

  private setForm(group?: FilterGroupModel) {
    if (!FilterTypeHelper.isSpatialFilterGroup(group)) {
      this.geometries$.next([]);
      return;
    }
    const geometries = group.filters.reduce<SpatialFilterGeometry[]>((g, filter) => {
      return [ ...g, ...filter.geometries ];
    }, []);
    this.updatingForm = true;
    this.currentGroup = group;
    this.geometries$.next(geometries);
    this.selectedLayers.patchValue(group.layerIds, { emitEvent: false });
  }

  private updateCreateGroup(layers: number[], geometries: SpatialFilterGeometry[]) {
    if (layers.length === 0 || geometries.length === 0) {
      return;
    }
    if (this.updatingForm) {
      this.updatingForm = false;
      return;
    }
    if (!this.currentGroup) {
      this.createFilterService.createSpatialFilterGroup$(geometries, layers)
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

  public save() {
    this.store$.dispatch(closeForm());
  }

  public remove() {
    if (!this.currentGroup) {
      return;
    }
    this.store$.dispatch(removeFilterGroup({ filterGroupId: this.currentGroup.id }));
    this.store$.dispatch(closeForm());
  }

}
