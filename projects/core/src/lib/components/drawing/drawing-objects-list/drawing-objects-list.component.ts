import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';
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

  @Input()
  public drawingLayerId = '';

  @ViewChild('editDescription')
  private editDescription: ElementRef | null = null;

  public features$: Observable<Array<DrawingFeatureModel & { selected: boolean }>> = combineLatest([
    this.store$.select(selectDrawingFeatures),
    this.store$.select(selectSelectedDrawingFeature),
  ]).pipe(map(([ features, selectedFeature ]) => {
    return features.map(f => ({ ...f, selected: f.__fid === selectedFeature?.__fid }));
  }));
  public editingDescriptionForFeatureFid: string | null = null;

  constructor(
    private store$: Store,
  ) {
    // TODO: scroll to selected feature -- ViewportScroller or scrollIntoView() don't work somehow
  }

  public selectFeature(fid: string) {
    this.store$.dispatch(setSelectedFeature({ fid }));
  }

  public stripMacros(description: string | undefined) {
    return (description || '').replace(/\[[A-Z]+]/g, '');
  }

  public selectFeatureAndEditDescription(fid: string) {
    this.selectFeature(fid);
    this.editingDescriptionForFeatureFid = fid;
    setTimeout(() => {
      this.editDescription?.nativeElement.focus();
    }, 0);
  }

  public updateDescription() {
    if (!this.editingDescriptionForFeatureFid || !this.editDescription) {
      return;
    }
    this.store$.dispatch(updateDrawingFeatureStyle({ fid: this.editingDescriptionForFeatureFid, style: { description: this.editDescription.nativeElement.value } }));
    this.editingDescriptionForFeatureFid = null;
  }

  public cancelDescriptionEdit() {
    this.editingDescriptionForFeatureFid = null;
  }
}
