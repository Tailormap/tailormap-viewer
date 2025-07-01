import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectDrawingFeatures, selectSelectedDrawingFeature, setSelectedFeature, updateDrawingFeatureStyle } from '../state';
import { combineLatest, map, Observable } from 'rxjs';
import { DrawingFeatureModel } from '../models/drawing-feature.model';

@Component({
  selector: 'tm-drawing-objects-list',
  templateUrl: './drawing-objects-list.component.html',
  styleUrls: ['./drawing-objects-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DrawingObjectsListComponent {
  private store$ = inject(Store);


  @Input()
  public drawingLayerId = '';

  @ViewChild('editLabel')
  private editLabel: ElementRef | null = null;

  public features$: Observable<Array<DrawingFeatureModel & { selected: boolean }>> = combineLatest([
    this.store$.select(selectDrawingFeatures),
    this.store$.select(selectSelectedDrawingFeature),
  ]).pipe(map(([ features, selectedFeature ]) => {
    return features.map(f => ({ ...f, selected: f.__fid === selectedFeature?.__fid }));
  }));
  public editingLabelForFeatureFid: string | null = null;

  public selectFeature(fid: string) {
    this.store$.dispatch(setSelectedFeature({ fid }));
  }

  public stripMacros(label: string | undefined) {
    return (label || '').replace(/\[[A-Z]+]/g, '');
  }

  public selectFeatureAndEditLabel(fid: string) {
    this.selectFeature(fid);
    this.editingLabelForFeatureFid = fid;
    setTimeout(() => {
      this.editLabel?.nativeElement.focus();
    }, 0);
  }

  public updateLabel() {
    if (!this.editingLabelForFeatureFid || !this.editLabel) {
      return;
    }
    this.store$.dispatch(updateDrawingFeatureStyle({ fid: this.editingLabelForFeatureFid, style: { label: this.editLabel.nativeElement.value } }));
    this.editingLabelForFeatureFid = null;
  }

  public cancelLabelEdit() {
    this.editingLabelForFeatureFid = null;
  }
}
