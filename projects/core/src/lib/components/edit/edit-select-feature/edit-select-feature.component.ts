import { Component, OnInit, ChangeDetectionStrategy, Input, DestroyRef } from '@angular/core';
import { FeatureInfoFeatureModel } from "../../feature-info/models/feature-info-feature.model";
import { MapService } from "@tailormap-viewer/map";
import { Store } from "@ngrx/store";
import { FeatureStylingHelper } from "../../../shared/helpers/feature-styling.helper";
import { BehaviorSubject } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { setSelectedEditFeature } from "../state/edit.actions";

@Component({
  selector: 'tm-edit-select-feature',
  templateUrl: './edit-select-feature.component.html',
  styleUrls: ['./edit-select-feature.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditSelectFeatureComponent implements OnInit {

  @Input()
  public features: FeatureInfoFeatureModel[] = [];

  private highlightedFeatureGeometrySubject = new BehaviorSubject<string | null>(null);
  private highlightedFeatureGeometry$ = this.highlightedFeatureGeometrySubject.asObservable();

  constructor(
      private mapService: MapService,
      private store$: Store,
      private destroyRef: DestroyRef,
  ) { }

  public ngOnInit(): void {
    this.mapService.renderFeatures$(
        'select-edit-feature-highlight-layer',
        this.highlightedFeatureGeometry$,
        FeatureStylingHelper.getDefaultHighlightStyle('select-edit-feature-highlight-style'),
    )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
  }

  public highlightFeature(feature?: FeatureInfoFeatureModel) {
    this.highlightedFeatureGeometrySubject.next(feature?.geometry || null);
  }

  public hideHighlight() {
    this.highlightedFeatureGeometrySubject.next(null);
  }

  public selectFeature($event: MouseEvent, feature: FeatureInfoFeatureModel) {
    $event.preventDefault();
    this.store$.dispatch(setSelectedEditFeature({ fid: feature.__fid }));
  }

  public trackByFid(idx: number, feature: FeatureInfoFeatureModel) {
    return feature.__fid;
  }

}
