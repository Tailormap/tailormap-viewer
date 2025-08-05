import { ChangeDetectionStrategy, Component, computed, DestroyRef, signal, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectCurrentFeatureForEdit,
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
import { setEditActive, setLoadedEditFeature } from '../../edit/state/edit.actions';
import { AuthenticatedUserService, BaseComponentTypeEnum, FeatureInfoConfigModel } from '@tailormap-viewer/api';
import { ComponentConfigHelper } from '../../../shared/helpers/component-config.helper';

@Component({
  selector: 'tm-feature-info-dialog',
  templateUrl: './feature-info-dialog.component.html',
  styleUrls: ['./feature-info-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FeatureInfoDialogComponent {
  private store$ = inject(Store);
  breakpointObserver = inject(BreakpointObserver);
  private destroyRef = inject(DestroyRef);
  private authenticatedUserService = inject(AuthenticatedUserService);


  public dialogOpen$: Observable<boolean>;
  public dialogCollapsed$: Observable<boolean>;
  public currentFeature$: Observable<FeatureInfoModel | null>;
  public selectedLayer$: Observable<FeatureInfoLayerModel | null>;
  public selectedSingleLayer$: Observable<FeatureInfoLayerModel | null>;
  public isPrevButtonDisabled$: Observable<boolean>;
  public isNextButtonDisabled$: Observable<boolean>;
  public isEditPossible$: Observable<boolean>;

  public panelWidth = 600;
  public panelWidthCollapsed = 300;

  private bodyMargin = CssHelper.getCssVariableValueNumeric('--body-margin');
  public panelWidthMargin = CssHelper.getCssVariableValueNumeric('--menubar-width') + (this.bodyMargin * 2);

  public showEditButtonConfig: boolean = true;

  public isWideScreen = signal<boolean>(false);
  public expandedList = signal<boolean>(false);
  public attributesCollapsed = signal<boolean>(false);
  public toggleIcon = computed(() => this.attributesCollapsed() ? 'chevron_top' : 'chevron_bottom');

  constructor() {
    const store$ = this.store$;

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

    ComponentConfigHelper.useInitialConfigForComponent<FeatureInfoConfigModel>(
      store$,
      BaseComponentTypeEnum.FEATURE_INFO,
      config => {
        this.showEditButtonConfig = config.showEditButton ?? true;
      },
    );

    this.isPrevButtonDisabled$ = this.store$.select(selectIsPrevButtonDisabled);
    this.isNextButtonDisabled$ = this.store$.select(selectIsNextButtonDisabled);
    this.isEditPossible$ = combineLatest([
      this.authenticatedUserService.getUserDetails$(),
      this.currentFeature$,
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(([ userDetails, feature ]) => {
        const isAuthenticated = userDetails.isAuthenticated;
        const isLayerEditable = feature?.layer?.editable ?? false;
        return isAuthenticated && isLayerEditable;
      }),
    );

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

  public toggleAttributes() {
    this.attributesCollapsed.set(!this.attributesCollapsed());
  }

  public editFeature() {
    this.store$.dispatch(setEditActive({ active: true }));
    this.store$.select(selectCurrentFeatureForEdit)
      .pipe(take(1))
      .subscribe(featureWithMetadata => {
        if (featureWithMetadata) {
          this.store$.dispatch(setLoadedEditFeature({
            feature: featureWithMetadata.feature,
            columnMetadata: featureWithMetadata.columnMetadata,
          }));
        }
      });

  }
}
