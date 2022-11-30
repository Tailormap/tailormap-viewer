import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFilterableLayers } from '../../../map/state/map.selectors';
import { ExtendedAppLayerModel } from '../../../map/models';
import { BehaviorSubject, map, Observable, of, Subject, take, takeUntil } from 'rxjs';
import { FormControl } from '@angular/forms';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import { DrawingToolEvent, MapService, MapStyleModel } from '@tailormap-viewer/map';
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
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'tm-spatial-filter-form',
  templateUrl: './spatial-filter-form.component.html',
  styleUrls: ['./spatial-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpatialFilterFormComponent implements OnInit, OnDestroy {

  private DRAWING_STYLE: Partial<MapStyleModel> = {
    pointType: undefined,
    fillColor: '#6236ff',
    fillOpacity: 30,
    strokeWidth: 2,
  };

  private DEFAULT_STYLE = (feature: FeatureModel) => FeatureStylingHelper.getDefaultHighlightStyle('filter-drawing-style', {
    ...this.DRAWING_STYLE,
    buffer: feature.attributes?.buffer,
  });

  private SELECTED_STYLE = (feature: FeatureModel) => FeatureStylingHelper.getDefaultHighlightStyle('filter-selected-style', {
    ...this.DRAWING_STYLE,
    isSelected: true,
    buffer: feature.attributes?.buffer,
  });

  private store$ = inject(Store);
  private mapService = inject(MapService);
  private createFilterService = inject(CreateFilterService);
  private removeFilterService = inject(RemoveFilterService);
  private cdr = inject(ChangeDetectorRef);

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

  public buffer = new FormControl<number>(0, {
    nonNullable: true,
  });

  private geometriesSubject$ = new BehaviorSubject<Array<SpatialFilterGeometry & {buffer?: number}>>([]);
  private geometries$ = this.geometriesSubject$.asObservable();
  private drawingFeatures$: Observable<FeatureModel[]> = this.geometries$
    .pipe(map(geometries => {
      return geometries.map<FeatureModel>(geom => ({
        __fid: geom.id,
        geometry: geom.geometry,
        attributes: {
          buffer: geom.buffer,
        },
      }));
    }));
  public hasGeometry$ = this.geometries$.pipe(map(geometries => geometries.length > 0));
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

    this.buffer.valueChanges
      .pipe(takeUntil(this.destroyed), debounceTime(250))
      .subscribe(() => this.updateCreateGroup());

    this.selectedLayers.valueChanges
      .pipe(takeUntil(this.destroyed))
      .subscribe(() => this.updateCreateGroup());
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public drawingAdded($event: DrawingToolEvent) {
    const currentGeometries = this.geometriesSubject$.value;
    const updatedGeometries = [ ...currentGeometries, { id: nanoid(), geometry: $event.geometry }];
    this.geometriesSubject$.next(updatedGeometries);
    this.updateCreateGroup(updatedGeometries);
  }

  public featureRemoved($event: string) {
    const currentGeometries = this.geometriesSubject$.value;
    const updatedGeometries = currentGeometries.filter(geom => geom.id !== $event);
    this.geometriesSubject$.next(updatedGeometries);
    this.updateCreateGroup(updatedGeometries);
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

  private getBufferValue(): number | undefined {
    const buffer = this.buffer.value;
    if (!buffer || buffer === 0 || isNaN(+(buffer))) {
      return undefined;
    }
    return +(buffer);
  }

  private setForm(group?: FilterGroupModel) {
    if (!FilterTypeHelper.isSpatialFilterGroup(group)) {
      this.currentGroup = undefined;
      this.selectedLayers.patchValue([], { emitEvent: false });
      this.geometriesSubject$.next([]);
      this.buffer.patchValue(0, { emitEvent: false });
      this.cdr.detectChanges();
      return;
    }
    const buffer = group.filters.length > 0 ? group.filters[0].buffer : undefined;
    const geometries = group.filters.reduce<SpatialFilterGeometry[]>((g, filter) => {
      return [ ...g, ...filter.geometries.map(geom => ({ ...geom, buffer: filter.buffer })) ];
    }, []);
    this.currentGroup = group;
    this.geometriesSubject$.next(geometries);
    this.buffer.patchValue(buffer || 0, { emitEvent: false });
    this.selectedLayers.patchValue(group.layerIds, { emitEvent: false });
    this.cdr.detectChanges();
  }

  private updateCreateGroup(updatedGeometries?: SpatialFilterGeometry[]) {
    const geometries = updatedGeometries || this.geometriesSubject$.value;
    const layers = this.selectedLayers.value;
    if (layers.length === 0 || geometries.length === 0) {
      return;
    }
    const buffer = this.getBufferValue();
    if (!this.currentGroup) {
      this.createFilterService.createSpatialFilterGroup$(geometries || [], layers, buffer)
        .pipe(take(1))
        .subscribe(group => {
          this.store$.dispatch(addFilterGroup({ group }));
          this.store$.dispatch(setSelectedFilterGroup({ id: group.id }));
        });
      return;
    }
    this.createFilterService.updateSpatialFilterGroup$(this.currentGroup, geometries, layers, buffer)
      .pipe(take(1))
      .subscribe(updatedFilterGroup => {
        this.store$.dispatch(updateFilterGroup({ filterGroup: updatedFilterGroup }));
      });
  }

}
