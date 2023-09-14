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
import { CssHelper } from '@tailormap-viewer/shared';
import { ViewerLayoutService } from '../../../services/viewer-layout/viewer-layout.service';

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

  public panelWidth = 300;
  private bodyMargin = CssHelper.getCssVariableValueNumeric('--body-margin');
  public panelWidthMargin = CssHelper.getCssVariableValueNumeric('--menubar-width') + (this.bodyMargin * 2);

  constructor(
    private store$: Store,
    private layoutService: ViewerLayoutService,
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

    this.dialogOpen$
      .pipe(takeUntil(this.destroyed))
      .subscribe(open => {
        this.layoutService.setRightPadding(open ? this.panelWidth + this.bodyMargin : 0);
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

  public isBackDisabled() {
    return this.totalFeatures <= 1 || this.currentSelected === 0;
  }

  public isNextDisabled() {
    return this.totalFeatures <= 1 || this.currentSelected === this.totalFeatures - 1;
  }

}
