import { Component, ChangeDetectionStrategy, Input, OnDestroy, inject } from '@angular/core';
import { DrawingToolEvent, MapStyleModel } from '@tailormap-viewer/map';
import { addFeature, setSelectedDrawingStyle, setSelectedFeature } from '../state/drawing.actions';
import { DrawingHelper } from '../helpers/drawing.helper';
import { Store } from '@ngrx/store';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import { FeatureModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-create-drawing-button',
  templateUrl: './create-drawing-button.component.html',
  styleUrls: ['./create-drawing-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CreateDrawingButtonComponent implements OnDestroy {

  @Input()
  public drawingLayerId = '';

  public selectionStyle = DrawingHelper.applyDrawingStyle as ((feature: FeatureModel) => MapStyleModel);
  private activeTool: DrawingFeatureTypeEnum | null = null;

  private store$ = inject(Store);

  public ngOnDestroy() {
    this.store$.dispatch(setSelectedFeature({ fid: null }));
  }

  public onDrawingAdded($event: DrawingToolEvent) {
    if (!this.activeTool) {
      return;
    }
    this.store$.dispatch(addFeature({
      feature: DrawingHelper.getFeature(this.activeTool, $event),
      selectFeature: true,
    }));
  }

  public onActiveToolChanged($event: DrawingFeatureTypeEnum | null) {
    this.activeTool = $event;
    this.store$.dispatch(setSelectedDrawingStyle({ drawingType: $event }));
  }

  public onFeatureSelected($event: string | null) {
    this.store$.dispatch(setSelectedFeature({ fid: $event || null }));
  }

}
