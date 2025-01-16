import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
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
    this.filterCrudService.addGeometry({ id: nanoid(), geometry: $event.geometry });
  }

  public featureRemoved($event: string) {
    this.filterCrudService.removeGeometry($event);
  }

}
