import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectCurrentlySelectedFeature,
  selectFeatureInfoDialogCollapsed,
  selectFeatureInfoDialogVisible, selectFeatureInfoLayers,
  selectIsNextButtonDisabled,
  selectIsPrevButtonDisabled, selectSelectedFeatureInfoLayer,
} from '../state/feature-info.selectors';
import { map, Observable } from 'rxjs';
import {
  expandCollapseFeatureInfoDialog, hideFeatureInfoDialog, showNextFeatureInfoFeature, showPreviousFeatureInfoFeature,
} from '../state/feature-info.actions';
import { FeatureInfoModel } from '../models/feature-info.model';
import { CssHelper } from '@tailormap-viewer/shared';
import { FeatureInfoLayerModel } from '../models/feature-info-layer.model';
import { FeatureInfoLayerListItemModel } from '../models/feature-info-layer-list-item.model';
import { FeatureInfoHelper } from '../helpers/feature-info.helper';

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
  public selectedLayer$: Observable<FeatureInfoLayerModel | null>;
  public singleLayer$: Observable<boolean>;
  public isPrevButtonDisabled$: Observable<boolean>;
  public isNextButtonDisabled$: Observable<boolean>;

  public panelWidth = 600;
  public panelWidthCollapsed = 300;

  private bodyMargin = CssHelper.getCssVariableValueNumeric('--body-margin');
  public panelWidthMargin = CssHelper.getCssVariableValueNumeric('--menubar-width') + (this.bodyMargin * 2);

  constructor(
    private store$: Store,
  ) {
    this.dialogOpen$ = this.store$.select(selectFeatureInfoDialogVisible);
    this.dialogCollapsed$ = this.store$.select(selectFeatureInfoDialogCollapsed);
    this.currentFeature$ = this.store$.select(selectCurrentlySelectedFeature);
    this.selectedLayer$ = this.store$.select(selectSelectedFeatureInfoLayer);
    this.singleLayer$ = this.store$.select(selectFeatureInfoLayers).pipe(map(l => l.length === 1));
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

  public getLayerListItem(layer: FeatureInfoLayerModel): FeatureInfoLayerListItemModel {
    return { ...layer, selected: false, disabled: FeatureInfoHelper.isLayerDisabled(layer) };
  }

}
