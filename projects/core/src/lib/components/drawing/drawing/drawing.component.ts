import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { MapService } from '@tailormap-viewer/map';
import { Observable, of, Subject, takeUntil } from 'rxjs';
import { selectFeaturesIncludingSelected } from '../state/drawing.selectors';
import { DrawingHelper } from '../helpers/drawing.helper';
import { MenubarService } from '../../menubar';
import { DrawingMenuButtonComponent } from '../drawing-menu-button/drawing-menu-button.component';
import { DrawingFeatureModelAttributes } from '../models/drawing-feature.model';
import { DRAWING_ID } from '../drawing-identifier';

@Component({
  selector: 'tm-drawing',
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public drawingLayerId = 'drawing-layer';
  public active$: Observable<boolean> = of(false);

  constructor(
    private store$: Store,
    private mapService: MapService,
    private menubarService: MenubarService,
  ) { }

  public ngOnInit() {
    this.active$ = this.menubarService.isComponentVisible$(DRAWING_ID);

    this.mapService.renderFeatures$<DrawingFeatureModelAttributes>(
      this.drawingLayerId,
      this.store$.select(selectFeaturesIncludingSelected),
      DrawingHelper.applyDrawingStyle,
    ).pipe(takeUntil(this.destroyed)).subscribe();

    this.menubarService.registerComponent(DrawingMenuButtonComponent);
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
