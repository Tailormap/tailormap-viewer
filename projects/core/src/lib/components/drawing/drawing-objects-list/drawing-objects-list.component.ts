import { afterEveryRender, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, signal, ViewChild, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectDrawingFeatureByFid, selectDrawingFeatures, selectSelectedDrawingFeature, updateDrawingFeatureStyle } from '../state';
import { combineLatest, map, Observable, take } from 'rxjs';
import { DrawingFeatureModel } from '../../../map/models/drawing-feature.model';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription } from '@angular/material/expansion';
import { DrawingStyleIconComponent } from '../../../map/components/drawing-style-icon/drawing-style-icon.component';
import { AsyncPipe } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel, TooltipDirective } from '@tailormap-viewer/shared';

@Component({
    selector: 'tm-drawing-objects-list',
    templateUrl: './drawing-objects-list.component.html',
    styleUrls: ['./drawing-objects-list.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatExpansionPanelTitle,
        MatExpansionPanelDescription,
        DrawingStyleIconComponent,
        AsyncPipe,
        MatIconButton,
        MatIcon,
        TooltipDirective,
    ],
})
export class DrawingObjectsListComponent {
  private store$ = inject(Store);
  private elRef = inject(ElementRef);
  private clipboard = inject(Clipboard);
  private snackBar = inject(MatSnackBar);

  private static readonly MAX_WKT_LENGTH_IN_MESSAGE = 500;

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

  constructor() {
    afterEveryRender(() => {
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

  public copyFeatureWkt(fid: string) {
    this.store$.select(selectDrawingFeatureByFid(fid))
      .pipe(take(1))
      .subscribe(feature => {
        const wkt = feature?.geometry;
        if (!wkt) {
          this.showSnackbarMessage($localize `:@@core.drawing.copy-object-wkt-not-found:No geometry found for this drawing object`);
          return;
        }
        if (!this.clipboard.copy(wkt)) {
          this.showSnackbarMessage($localize `:@@core.drawing.copy-object-wkt-failed:Failed to copy WKT to clipboard`);
          return;
        }
        const displayWkt = wkt.length > DrawingObjectsListComponent.MAX_WKT_LENGTH_IN_MESSAGE
          ? `${wkt.substring(0, DrawingObjectsListComponent.MAX_WKT_LENGTH_IN_MESSAGE)}...`
          : wkt;
        this.showSnackbarMessage($localize `:@@core.drawing.copy-object-wkt-copied:Object WKT copied to clipboard: ${displayWkt}`);
      });
  }

  private showSnackbarMessage(message: string) {
    const config: SnackBarMessageOptionsModel = {
      message,
      duration: 5000,
      showDuration: true,
      showCloseButton: true,
    };
    SnackBarMessageComponent.open$(this.snackBar, config).subscribe();
  }

  private srcolledToFeature: string | null = null;

  private scrollToSelectedFeature() {
    if (!this.isExpanded() || !this.selectedFeature || !this.elRef || !this.elRef.nativeElement || this.srcolledToFeature === this.selectedFeature) {
      return;
    }
    this.srcolledToFeature = this.selectedFeature;
    this.elRef.nativeElement.querySelector(`[data-feature-fid="${this.selectedFeature}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

}
