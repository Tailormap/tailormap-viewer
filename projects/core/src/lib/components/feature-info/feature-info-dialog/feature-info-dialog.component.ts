import { ChangeDetectionStrategy, Component, computed, DestroyRef, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectCurrentlySelectedFeature,
  selectFeatureInfoDialogCollapsed,
  selectFeatureInfoDialogVisible, selectFeatureInfoLayerListCollapsed, selectFeatureInfoLayers,
  selectIsNextButtonDisabled,
  selectIsPrevButtonDisabled, selectMapCoordinates, selectSelectedFeatureInfoLayer,
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
import {
  loadEditFeatures, setEditActive, setSelectedEditFeature, setSelectedEditLayer, showEditDialog,
} from '../../edit/state/edit.actions';
import { AuthenticatedUserService } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-feature-info-dialog',
  templateUrl: './feature-info-dialog.component.html',
  styleUrls: ['./feature-info-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FeatureInfoDialogComponent {

  public dialogOpen$: Observable<boolean>;
  public dialogCollapsed$: Observable<boolean>;
  public currentFeature$: Observable<FeatureInfoModel | null>;
  public selectedLayer$: Observable<FeatureInfoLayerModel | null>;
  public selectedSingleLayer$: Observable<FeatureInfoLayerModel | null>;
  public isPrevButtonDisabled$: Observable<boolean>;
  public isNextButtonDisabled$: Observable<boolean>;
  public isEditButtonDisabled$: Observable<boolean>;

  public panelWidth = 600;
  public panelWidthCollapsed = 300;

  private bodyMargin = CssHelper.getCssVariableValueNumeric('--body-margin');
  public panelWidthMargin = CssHelper.getCssVariableValueNumeric('--menubar-width') + (this.bodyMargin * 2);

  private defaultEditTooltip = $localize `:@@core.feature-info.edit-feature-tooltip:Edit feature`;
  private notLoggedInEditTooltip = $localize `:@@core.feature-info.require-login-tooltip:You must be logged in to edit`;
  private notEditableEditTooltip = $localize `:@@core.feature-info.not-editable-tooltip:This layer is not editable`;

  public editTooltip = this.defaultEditTooltip;

  public isWideScreen = signal<boolean>(false);
  public expandedList = signal<boolean>(false);
  public attributesCollapsed = signal<boolean>(false);
  public toggleIcon = computed(() => this.attributesCollapsed() ? 'chevron_top' : 'chevron_bottom');

  constructor(
    private store$: Store,
    public breakpointObserver: BreakpointObserver,
    private destroyRef: DestroyRef,
    private authenticatedUserService: AuthenticatedUserService,
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
    this.isEditButtonDisabled$ = combineLatest([
      this.authenticatedUserService.getUserDetails$(),
      this.currentFeature$,
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(([ userDetails, feature ]) => {
        const isAuthenticated = userDetails.isAuthenticated;
        const isLayerEditable = feature?.layer?.editable ?? false;
        return !isAuthenticated || !isLayerEditable;
      }),
    );
    combineLatest([
      this.authenticatedUserService.getUserDetails$(),
      this.currentFeature$,
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(([ userDetails, feature ]) => {
      if (!userDetails.isAuthenticated) {
        this.editTooltip = this.notLoggedInEditTooltip;
      } else if (feature && feature.layer && feature.layer.editable) {
        this.editTooltip = this.defaultEditTooltip;
      } else {
        this.editTooltip = this.notEditableEditTooltip;
      }
    });

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
    this.store$.select(selectMapCoordinates).pipe(take(1)).subscribe(coordinates => {
      if (coordinates) {
        this.store$.dispatch(loadEditFeatures({ coordinates }));
      }
    });
    this.currentFeature$.pipe(take(1)).subscribe(feature => {
      if (feature) {
        this.store$.dispatch(setSelectedEditLayer({ layer: feature.layer.id }));
        this.store$.dispatch(setSelectedEditFeature({ fid: feature.__fid }));
      }
    });
    this.store$.dispatch(hideFeatureInfoDialog());
    this.store$.dispatch(showEditDialog());
  }
}
