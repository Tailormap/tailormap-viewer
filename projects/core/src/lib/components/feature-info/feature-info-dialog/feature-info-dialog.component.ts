import { ChangeDetectionStrategy, Component, DestroyRef, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectCurrentlySelectedFeature,
  selectFeatureInfoDialogCollapsed,
  selectFeatureInfoDialogVisible, selectFeatureInfoLayerListCollapsed, selectFeatureInfoLayers,
  selectIsNextButtonDisabled,
  selectIsPrevButtonDisabled, selectSelectedFeatureInfoLayer,
} from '../state/feature-info.selectors';
import { map, Observable, combineLatest, take } from 'rxjs';
import {
  expandCollapseFeatureInfoDialog, expandCollapseFeatureInfoLayerList, hideFeatureInfoDialog, showNextFeatureInfoFeature,
  showPreviousFeatureInfoFeature,
} from '../state/feature-info.actions';
import { FeatureInfoModel } from '../models/feature-info.model';
import { CssHelper } from '@tailormap-viewer/shared';
import { FeatureInfoLayerModel } from '../models/feature-info-layer.model';
import { FeatureInfoLayerListItemModel } from '../models/feature-info-layer-list-item.model';
import { FeatureInfoHelper } from '../helpers/feature-info.helper';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  public selectedSingleLayer$: Observable<FeatureInfoLayerModel | null>;
  public isPrevButtonDisabled$: Observable<boolean>;
  public isNextButtonDisabled$: Observable<boolean>;

  public panelWidth = 600;
  public panelWidthCollapsed = 300;

  private bodyMargin = CssHelper.getCssVariableValueNumeric('--body-margin');
  public panelWidthMargin = CssHelper.getCssVariableValueNumeric('--menubar-width') + (this.bodyMargin * 2);

  public isWideScreen = signal<boolean>(false);
  public expandedList = signal<boolean>(false);

  constructor(
    private store$: Store,
    public breakpointObserver: BreakpointObserver,
    private destroyRef: DestroyRef,
  ) {
    this.dialogOpen$ = this.store$.select(selectFeatureInfoDialogVisible);
    this.dialogCollapsed$ = this.store$.select(selectFeatureInfoDialogCollapsed);
    this.currentFeature$ = this.store$.select(selectCurrentlySelectedFeature);
    this.selectedLayer$ = this.store$.select(selectSelectedFeatureInfoLayer);
    this.selectedSingleLayer$ = combineLatest([
      this.store$.select(selectSelectedFeatureInfoLayer),
      this.store$.select(selectFeatureInfoLayers),
    ]).pipe(map(([ selectedLayer, layers ]) => {
      if (selectedLayer && layers.length === 1 && layers[0].id === selectedLayer.id) {
        return selectedLayer;
      }
      return null;
    }));
    this.isPrevButtonDisabled$ = this.store$.select(selectIsPrevButtonDisabled);
    this.isNextButtonDisabled$ = this.store$.select(selectIsNextButtonDisabled);
    combineLatest([
      this.store$.select(selectFeatureInfoLayerListCollapsed),
      this.breakpointObserver.observe('(max-width: 600px)'),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([ listCollapsed, smallScreen ]) => {
        if (smallScreen.matches) {
          this.isWideScreen.set(false);
          this.expandedList.set(false);
        } else {
          this.isWideScreen.set(true);
          this.expandedList.set(!listCollapsed);
        }
      });
  }

  public next() {
    this.isNextButtonDisabled$
      .pipe(take(1))
      .subscribe(disableNext => {
        if (!disableNext) {
          this.store$.dispatch(showNextFeatureInfoFeature());
        }
      });
  }

  public back() {
    this.isPrevButtonDisabled$
      .pipe(take(1))
      .subscribe(disablePrev => {
        if (!disablePrev) {
          this.store$.dispatch(showPreviousFeatureInfoFeature());
        }
      });
  }

  public closeDialog() {
    this.store$.dispatch(hideFeatureInfoDialog());
  }

  public expandCollapseDialog() {
    this.store$.dispatch(expandCollapseFeatureInfoDialog());
  }

  public toggleListExpanded() {
    this.store$.dispatch(expandCollapseFeatureInfoLayerList());
  }

  public getLayerListItem(layer: FeatureInfoLayerModel): FeatureInfoLayerListItemModel {
    return { ...layer, selected: false, disabled: FeatureInfoHelper.isLayerDisabled(layer) };
  }

}
