import { Component, OnInit, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import { FeatureModel } from '@tailormap-viewer/api';
import { FeatureStylingHelper } from '../../../shared/helpers/feature-styling.helper';
import { DrawingToolEvent } from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { addGeometry, removeGeometry } from '../state/filter-component.actions';
import { nanoid } from 'nanoid';

@Component({
  selector: 'tm-spatial-filter-form-draw-geometries',
  templateUrl: './spatial-filter-form-draw-geometries.component.html',
  styleUrls: ['./spatial-filter-form-draw-geometries.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpatialFilterFormDrawGeometriesComponent implements OnInit {

  private store$ = inject(Store);

  @Input()
  public drawingLayerId = '';

  public selectedStyle = (feature: FeatureModel) => FeatureStylingHelper.getDefaultHighlightStyle('filter-selected-style', {
    pointType: undefined,
    fillColor: '#6236ff',
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

  constructor() { }

  public ngOnInit(): void {
  }

  public drawingAdded($event: DrawingToolEvent) {
    this.store$.dispatch(addGeometry({ geometry: { id: nanoid(), geometry: $event.geometry } }));
  }

  public featureRemoved($event: string) {
    this.store$.dispatch(removeGeometry({ id: $event }));
  }

}
