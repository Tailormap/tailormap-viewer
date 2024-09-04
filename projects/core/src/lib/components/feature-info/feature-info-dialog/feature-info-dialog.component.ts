import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectCurrentlySelectedFeature, selectCurrentlySelectedLayerError,
  selectFeatureInfoDialogCollapsed,
  selectFeatureInfoDialogVisible,
  selectIsNextButtonDisabled,
  selectIsPrevButtonDisabled,
} from '../state/feature-info.selectors';
import { Observable } from 'rxjs';
import {
  expandCollapseFeatureInfoDialog, hideFeatureInfoDialog, showNextFeatureInfoFeature, showPreviousFeatureInfoFeature,
} from '../state/feature-info.actions';
import { FeatureInfoModel } from '../models/feature-info.model';
import { CssHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-feature-info-dialog',
  templateUrl: './feature-info-dialog.component.html',
  styleUrls: ['./feature-info-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureInfoDialogComponent {

  public dialogOpen$: Observable<boolean>;
  public dialogCollapsed$: Observable<boolean>;
  public currentFeature$: Observable<FeatureInfoModel | null>;
  public layerError$: Observable<string | null>;
  public isPrevButtonDisabled$: Observable<boolean>;
  public isNextButtonDisabled$: Observable<boolean>;

  public panelWidth = 600;
  private bodyMargin = CssHelper.getCssVariableValueNumeric('--body-margin');
  public panelWidthMargin = CssHelper.getCssVariableValueNumeric('--menubar-width') + (this.bodyMargin * 2);

  constructor(
    private store$: Store,
  ) {
    this.dialogOpen$ = this.store$.select(selectFeatureInfoDialogVisible);
    this.dialogCollapsed$ = this.store$.select(selectFeatureInfoDialogCollapsed);
    this.currentFeature$ = this.store$.select(selectCurrentlySelectedFeature);
    this.layerError$ = this.store$.select(selectCurrentlySelectedLayerError);
    this.isPrevButtonDisabled$ = this.store$.select(selectIsPrevButtonDisabled);
    this.isNextButtonDisabled$ = this.store$.select(selectIsNextButtonDisabled);
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

}
