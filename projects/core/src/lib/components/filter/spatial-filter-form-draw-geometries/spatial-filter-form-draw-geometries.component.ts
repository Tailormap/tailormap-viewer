import { Component, ChangeDetectionStrategy, Input, inject, Output, EventEmitter } from '@angular/core';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import { FeatureModel } from '@tailormap-viewer/api';
import { FeatureStylingHelper } from '../../../shared/helpers/feature-styling.helper';
import { DrawingToolEvent } from '@tailormap-viewer/map';
import { nanoid } from 'nanoid';
import { SpatialFilterCrudService } from '../services/spatial-filter-crud.service';
import { ApplicationStyleService } from '../../../services/application-style.service';

@Component({
  selector: 'tm-spatial-filter-form-draw-geometries',
  templateUrl: './spatial-filter-form-draw-geometries.component.html',
  styleUrls: ['./spatial-filter-form-draw-geometries.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SpatialFilterFormDrawGeometriesComponent {

  private filterCrudService = inject(SpatialFilterCrudService);

  @Input()
  public drawingLayerId = '';

  @Output()
  public featureSelected = new EventEmitter<string | null>();

  public selectedFeatureForModifyTool: FeatureModel | null = null;

  public selectedStyle = (feature: FeatureModel) => FeatureStylingHelper.getDefaultHighlightStyle('filter-selected-style', {
    pointType: undefined,
    fillColor: ApplicationStyleService.getPrimaryColor(),
    fillOpacity: 30,
    strokeWidth: 2,
    isSelected: true,
    buffer: feature.attributes?.buffer,
  });

  public allowedGeometryTypes: DrawingFeatureTypeEnum[] = [
    DrawingFeatureTypeEnum.LINE,
    DrawingFeatureTypeEnum.POLYGON,
    DrawingFeatureTypeEnum.CIRCLE,
  ];

  public drawingAdded($event: DrawingToolEvent) {
    const feature = { id: nanoid(), geometry: $event.geometry };
    this.filterCrudService.addGeometry(feature);
  }

  public featureRemoved($event: FeatureModel) {
    this.filterCrudService.removeGeometry($event.__fid);
    this.featureSelected.emit(null);
    this.selectedFeatureForModifyTool = null;
  }

  public onFeatureSelected(feature: FeatureModel | null) {
    console.log('SpatialFilterFormDrawGeometriesComponent.onFeatureSelected', feature);
    this.featureSelected.emit(feature?.__fid);
    this.selectedFeatureForModifyTool = feature;
  }

  public onFeatureGeometryModified(geometry: string) {
    if (this.selectedFeatureForModifyTool) {
      this.filterCrudService.updateGeometry(this.selectedFeatureForModifyTool.__fid, geometry);
    }
  }
}
