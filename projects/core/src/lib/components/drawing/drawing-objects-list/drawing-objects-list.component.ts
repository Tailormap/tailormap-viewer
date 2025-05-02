import { ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectDrawingFeatures, selectSelectedDrawingFeature, setSelectedFeature, updateDrawingFeatureStyle } from '../state';
import { Observable, Subject, takeUntil } from 'rxjs';
import { DrawingFeatureModel } from '../models/drawing-feature.model';

@Component({
  selector: 'tm-drawing-objects-list',
  templateUrl: './drawing-objects-list.component.html',
  styleUrls: ['./drawing-objects-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DrawingObjectsListComponent implements OnDestroy {
  private destroyed = new Subject();

  @Input()
  public drawingLayerId = '';

  public features$: Observable<DrawingFeatureModel[]>;

  public selectedFeature$: Observable<DrawingFeatureModel | null>;
  public editingLabelForFeatureFid: string | null = null;

  constructor(
    private store$: Store,
  ) {
    this.features$ = this.store$.select(selectDrawingFeatures).pipe(takeUntil(this.destroyed));
    this.selectedFeature$ = this.store$.select(selectSelectedDrawingFeature).pipe(takeUntil(this.destroyed));
    // TODO: scroll to selected feature -- ViewportScroller or scrollIntoView() don't work somehow
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public selectFeature(fid: string) {
    this.store$.dispatch(setSelectedFeature({ fid }));
  }

  public stripMacros(label: string | undefined) {
    return (label || '').replace(/\[[A-Z]+]/g, '');
  }

  @ViewChild('editLabel') private editLabel: ElementRef | null = null;

  public selectFeatureAndEditLabel(fid: string) {
    this.store$.dispatch(setSelectedFeature({ fid }));
    this.editingLabelForFeatureFid = fid;
    setTimeout(() => {
      this.editLabel?.nativeElement.focus();
    });
  }

  public updateLabel() {
    if (!this.editingLabelForFeatureFid || !this.editLabel) {
      return;
    }
    this.store$.dispatch(updateDrawingFeatureStyle({ fid: this.editingLabelForFeatureFid, style: { label: this.editLabel.nativeElement.value } }));
    this.editingLabelForFeatureFid = null;
  }
}
