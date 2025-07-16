import { afterRender, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, signal, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectDrawingFeatures, selectSelectedDrawingFeature, updateDrawingFeatureStyle } from '../state';
import { combineLatest, map, Observable, tap } from 'rxjs';
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

  @Output()
  public featureSelected = new EventEmitter<string>();

  @ViewChild('editDescription')
  private editDescription: ElementRef | null = null;

  public features$: Observable<Array<DrawingFeatureModel & { selected: boolean }>> = combineLatest([
    this.store$.select(selectDrawingFeatures),
    this.store$.select(selectSelectedDrawingFeature),
  ]).pipe(map(([ features, selectedFeature ]) => {
    this.selectedFeature = selectedFeature?.__fid ?? null;
    return features.map(f => ({ ...f, selected: f.__fid === selectedFeature?.__fid }));
  }));

  public editingDescriptionForFeatureFid: string | null = null;
  private selectedFeature: string | null = null;
  public isExpanded = signal<boolean>(false);

  constructor(
    private store$: Store,
    private elRef: ElementRef,
  ) {
    afterRender(() => {
      this.scrollToSelectedFeature();
    });
  }

  public selectFeature(fid: string) {
    this.featureSelected.emit(fid);
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

  private scrollToSelectedFeature() {
    if (!this.isExpanded() || !this.selectedFeature || !this.elRef || !this.elRef.nativeElement) {
      return;
    }
    this.elRef.nativeElement.querySelector(`[data-feature-fid="${this.selectedFeature}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

}
