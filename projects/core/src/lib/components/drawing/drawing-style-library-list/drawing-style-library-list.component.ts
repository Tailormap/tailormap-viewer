import { ChangeDetectionStrategy, Component, EventEmitter, Output, signal } from '@angular/core';
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

  public selectedDrawingStyle = this.drawingStylesService.selectedDrawingStyle;
  public drawingStyles$ = this.drawingStylesService.getDrawingStyles$();

  @Output()
  public drawingStyleSelected = new EventEmitter<DrawingFeatureModelAttributes>();

  constructor(
    private drawingStylesService: DrawingStylesService,
  ) {
  }

  public selectDrawingStyle(idx: number, style: DrawingFeatureModelAttributes) {
    this.drawingStylesService.setSelectedDrawingStyle(idx);
    this.drawingStyleSelected.emit(style);
  }

}
