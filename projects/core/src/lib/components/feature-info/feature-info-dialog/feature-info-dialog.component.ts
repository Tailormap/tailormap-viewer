import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectCurrentlySelectedFeature, selectFeatureInfoCounts, selectFeatureInfoDialogCollapsed, selectFeatureInfoDialogVisible,
} from '../state/feature-info.selectors';
import { Observable, of, Subject, takeUntil } from 'rxjs';
import {
  expandCollapseFeatureInfoDialog, hideFeatureInfoDialog, showNextFeatureInfoFeature, showPreviousFeatureInfoFeature,
} from '../state/feature-info.actions';
import { FeatureInfoModel } from '../models/feature-info.model';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-feature-info-dialog',
  templateUrl: './feature-info-dialog.component.html',
  styleUrls: ['./feature-info-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureInfoDialogComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public dialogOpen$: Observable<boolean> = of(false);
  public dialogCollapsed$: Observable<boolean> = of(false);

  public currentSelected = 0;
  public currentFeature$: Observable<FeatureInfoModel> | undefined;
  public totalFeatures = 0;

  constructor(
    private store$: Store,
    private cdr: ChangeDetectorRef,
  ) {}

  public ngOnInit(): void {
    this.dialogOpen$ = this.store$.select(selectFeatureInfoDialogVisible);
    this.dialogCollapsed$ = this.store$.select(selectFeatureInfoDialogCollapsed);
    this.currentFeature$ = this.store$.select(selectCurrentlySelectedFeature);
    this.store$.select(selectFeatureInfoCounts)
      .pipe(takeUntil(this.destroyed))
      .subscribe(counts => {
        this.currentSelected = counts.current;
        this.totalFeatures = counts.total;
        this.cdr.detectChanges();
      });
  }

  public next() {
    this.store$.dispatch(showNextFeatureInfoFeature());
  }

  public back() {
    this.store$.dispatch(showPreviousFeatureInfoFeature());
  }

  public closeDialog() {
    this.store$.dispatch(hideFeatureInfoDialog());
  }

  public expandCollapseDialog() {
    this.store$.dispatch(expandCollapseFeatureInfoDialog());
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public getAttributes(feature: FeatureInfoModel): ReadonlyMap<string, { label: string; value: string | number | boolean }> {
    const attr = new Map();
    Object.keys(feature.feature.attributes).forEach(key => {
      const metadata = feature.columnMetadata.get(key);
      if (metadata?.type === FeatureAttributeTypeEnum.GEOMETRY) {
        return;
      }
      const label = metadata?.alias || key;
      attr.set(key, { value: feature.feature.attributes[key], label });
    });
    return attr as ReadonlyMap<string, { label: string; value: string | number | boolean }>;
  }
}
