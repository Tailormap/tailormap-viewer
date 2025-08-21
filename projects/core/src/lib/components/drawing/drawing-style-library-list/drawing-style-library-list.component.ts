import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DrawingStylesService } from '../services/drawing-styles.service';
import { DrawingFeatureModelAttributes } from '../../../map/models/drawing-feature.model';
import { DrawingService } from '../../../map/services/drawing.service';
import { Store } from '@ngrx/store';
import { setSelectedFeature } from '../state';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import { DrawingHelper } from '../../../map/helpers/drawing.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-drawing-style-library-list',
  templateUrl: './drawing-style-library-list.component.html',
  styleUrls: ['./drawing-style-library-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  providers: [DrawingStylesService],
})
export class DrawingStyleLibraryListComponent {
  private drawingStylesService = inject(DrawingStylesService);
  private drawingService = inject(DrawingService);
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.drawingService.activeToolChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(activeTool => {
        if (activeTool === null) {
          this.selectedDrawingStyle.set(null);
        }
      });
    this.drawingService.drawingResetCalled$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.selectedDrawingStyle.set(null);
      });
  }

  public selectedDrawingStyle = signal<number | null>(null);
  public drawingStyles$ = this.drawingStylesService.getDrawingStyles$();

  public selectDrawingStyle(idx: number, style: DrawingFeatureModelAttributes) {
    this.selectedDrawingStyle.set(idx);
    this.applySelectedDrawingStyle(style);
  }

  private applySelectedDrawingStyle(style: DrawingFeatureModelAttributes) {
    this.store$.dispatch(setSelectedFeature({ fid: null }));
    this.drawingService.style.set({
      ...DrawingHelper.getDefaultStyle(),
      ...style.style,
      markerSize: style.type === DrawingFeatureTypeEnum.IMAGE ? 100 : undefined,
      label: '',
    });
    this.drawingService.lockedStyle.set(style.lockedStyle ?? false);
    if (style.type === DrawingFeatureTypeEnum.RECTANGLE_SPECIFIED_SIZE && style.rectangleSize) {
      this.drawingService.customRectangleWidth.set(style.rectangleSize.width);
      this.drawingService.customRectangleLength.set(style.rectangleSize.height);
    }
    if (style.type === DrawingFeatureTypeEnum.CIRCLE_SPECIFIED_RADIUS && style.circleRadius) {
      this.drawingService.customCircleRadius.set(style.circleRadius);
    }
    if (style.type === DrawingFeatureTypeEnum.SQUARE_SPECIFIED_LENGTH && style.squareLength) {
      this.drawingService.customSquareLength.set(style.squareLength);
    }
    if (this.drawingService.getActiveTool() !== style.type) {
      this.drawingService.toggle(style.type);
    }
  }


}
