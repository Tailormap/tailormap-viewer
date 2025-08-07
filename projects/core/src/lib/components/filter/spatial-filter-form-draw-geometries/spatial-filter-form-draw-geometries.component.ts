import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import { FeatureModel } from '@tailormap-viewer/api';
import { FeatureStylingHelper } from '../../../shared/helpers/feature-styling.helper';
import { DrawingToolEvent } from '@tailormap-viewer/map';
import { nanoid } from 'nanoid';
import { SpatialFilterCrudService } from '../services/spatial-filter-crud.service';
import { ApplicationStyleService } from '../../../services/application-style.service';
import { selectSelectedFilterFeature } from '../state/filter-component.selectors';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { setSelectedSpatialFilterFeatureId } from '../state/filter-component.actions';

@Component({
  selector: 'tm-spatial-filter-form-draw-geometries',
  templateUrl: './spatial-filter-form-draw-geometries.component.html',
  styleUrls: ['./spatial-filter-form-draw-geometries.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SpatialFilterFormDrawGeometriesComponent {
  private store$ = inject(Store);


  private filterCrudService = inject(SpatialFilterCrudService);

  @Input()
  public drawingLayerId = '';

  public selectedFeatureForModifyTool$ = this.store$.select(selectSelectedFilterFeature);

  public selectedStyle = (feature: FeatureModel) => FeatureStylingHelper.getDefaultHighlightStyle('filter-selected-style', {
    pointType: undefined,
    fillColor: ApplicationStyleService.getPrimaryColor(),
    fillOpacity: 30,
    strokeWidth: 2,
    buffer: feature.attributes?.buffer,
  });

  public allowedGeometryTypes: DrawingFeatureTypeEnum[] = [
    DrawingFeatureTypeEnum.LINE,
    DrawingFeatureTypeEnum.POLYGON,
    DrawingFeatureTypeEnum.CIRCLE,
  ];

  public drawingAdded($event: DrawingToolEvent) {
    const id = nanoid();
    const feature = { id, geometry: $event.geometry };
    this.filterCrudService.addGeometry(feature);
    this.store$.dispatch(setSelectedSpatialFilterFeatureId({ featureId: id }));
  }

  public featureRemoved($event: FeatureModel) {
    this.filterCrudService.removeGeometry($event.__fid);
    this.store$.dispatch(setSelectedSpatialFilterFeatureId({ featureId: null }));
  }

  public onFeatureSelected(feature: FeatureModel | null) {
    this.store$.dispatch(setSelectedSpatialFilterFeatureId({ featureId: feature?.__fid || null }));
  }

  public onFeatureGeometryModified(geometry: string) {
    this.selectedFeatureForModifyTool$
      .pipe(take(1))
      .subscribe(selectedFeature => {
        if (!selectedFeature) {
          return;
        }
        this.filterCrudService.updateGeometry(selectedFeature.__fid, geometry);
      });
  }
}
