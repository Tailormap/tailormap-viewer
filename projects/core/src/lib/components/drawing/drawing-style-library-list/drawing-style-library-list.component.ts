import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';
import { DrawingStylesService } from '../services/drawing-styles.service';
import { DrawingFeatureModelAttributes } from '../models/drawing-feature.model';

@Component({
  selector: 'tm-drawing-style-library-list',
  templateUrl: './drawing-style-library-list.component.html',
  styleUrls: ['./drawing-style-library-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DrawingStyleLibraryListComponent {
  private drawingStylesService = inject(DrawingStylesService);


  public selectedDrawingStyle = this.drawingStylesService.selectedDrawingStyle;
  public drawingStyles$ = this.drawingStylesService.getDrawingStyles$();

  @Output()
  public drawingStyleSelected = new EventEmitter<DrawingFeatureModelAttributes>();

  public selectDrawingStyle(idx: number, style: DrawingFeatureModelAttributes) {
    this.drawingStylesService.setSelectedDrawingStyle(idx);
    this.drawingStyleSelected.emit(style);
  }
}
