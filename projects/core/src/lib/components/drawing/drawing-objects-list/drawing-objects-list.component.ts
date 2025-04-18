import { ChangeDetectionStrategy, Component, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { DrawingFeatureModel, selectDrawingFeatures, selectSelectedDrawingFeature, setSelectedFeature } from '@tailormap-viewer/core';
import { Observable, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'tm-drawing-objects-list',
  templateUrl: './drawing-objects-list.component.html',
  styleUrls: ['./drawing-objects-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DrawingObjectsListComponent implements  OnDestroy {
  private destroyed = new Subject();

  @Input()
  public drawingLayerId = '';

  public features$: Observable<DrawingFeatureModel[]>;

  public selectedFeature$: Observable<DrawingFeatureModel | null>;

  constructor(
    private store$: Store,
  ) {
    this.features$ = this.store$.select(selectDrawingFeatures).pipe(takeUntil(this.destroyed));
    this.selectedFeature$ = this.store$.select(selectSelectedDrawingFeature).pipe(takeUntil(this.destroyed));
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public selectFeature(fid: string) {
    this.store$.dispatch(setSelectedFeature({ fid }));
  }
}
