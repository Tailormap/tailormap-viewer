import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DrawingStylesService } from '../services/drawing-styles.service';
import { DrawingFeatureModelAttributes } from '../../../map/models/drawing-feature.model';
import { DrawingService } from '../../../map/services/drawing.service';
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
    this.drawingService.setPredefinedStyle(style);
  }

}
