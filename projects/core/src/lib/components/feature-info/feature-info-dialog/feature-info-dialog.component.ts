import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectCurrentFeatureForEdit, selectCurrentlySelectedFeature, selectFeatureInfoDialogCollapsed, selectFeatureInfoDialogVisible,
  selectFeatureInfoLayerListCollapsed, selectFeatureInfoLayers, selectIsNextButtonDisabled, selectIsPrevButtonDisabled,
  selectSelectedFeatureInfoLayer,
} from '../state/feature-info.selectors';
import { combineLatest, map, Observable, take } from 'rxjs';
import {
  expandCollapseFeatureInfoDialog, expandCollapseFeatureInfoLayerList, hideFeatureInfoDialog, showNextFeatureInfoFeature,
  showPreviousFeatureInfoFeature,
} from '../state/feature-info.actions';
import { CssHelper } from '@tailormap-viewer/shared';
import { FeatureInfoLayerModel } from '../models/feature-info-layer.model';
import { FeatureInfoLayerListItemModel } from '../models/feature-info-layer-list-item.model';
import { FeatureInfoHelper } from '../helpers/feature-info.helper';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { setLoadedEditFeature } from '../../edit/state/edit.actions';
import {
  AuthenticatedUserService, BaseComponentTypeEnum, FeatureInfoConfigModel,
} from '@tailormap-viewer/api';
import { ComponentConfigHelper } from '../../../shared/helpers/component-config.helper';
import { selectIn3dView } from '../../../map/state/map.selectors';
import { MobileLayoutService } from '../../../services/viewer-layout/mobile-layout.service';
import { MenubarService } from '../../menubar';

@Component({
  selector: 'tm-feature-info-dialog',
  templateUrl: './feature-info-dialog.component.html',
  styleUrls: ['./feature-info-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FeatureInfoDialogComponent {
  private store$ = inject(Store);
  public breakpointObserver = inject(BreakpointObserver);
  private destroyRef = inject(DestroyRef);
  private authenticatedUserService = inject(AuthenticatedUserService);
  private mobileLayoutService = inject(MobileLayoutService);
  private menuBarService = inject(MenubarService);

  public dialogOpen$: Observable<boolean>;
  public dialogCollapsed$: Observable<boolean>;
  public currentFeature = toSignal(this.store$.select(selectCurrentlySelectedFeature), { initialValue: null });
  public selectedLayer$: Observable<FeatureInfoLayerModel | null>;
  public selectedSingleLayer$: Observable<FeatureInfoLayerModel | null>;
  public isPrevButtonDisabled$: Observable<boolean>;
  public isNextButtonDisabled$: Observable<boolean>;
  public isMobileLayoutEnabled$: Observable<boolean> = this.mobileLayoutService.isMobileLayoutEnabled$;

  public panelWidth = 600;
  public panelWidthCollapsed = 300;

  private bodyMargin = CssHelper.getCssVariableValueNumeric('--body-margin');
  public panelWidthMargin = CssHelper.getCssVariableValueNumeric('--menubar-width') + (this.bodyMargin * 2);

  public config = ComponentConfigHelper.componentConfigSignal<FeatureInfoConfigModel>(this.store$, BaseComponentTypeEnum.FEATURE_INFO);
  public editComponentEnabled= ComponentConfigHelper.componentEnabledConfigSignal(this.store$, BaseComponentTypeEnum.EDIT);
  private authenticatedUserDetails = toSignal(this.authenticatedUserService.getUserDetails$());
  private in3DView = this.store$.selectSignal(selectIn3dView);

  public isEditPossible = computed(() => {
    const showEditButton = !(this.config()?.showEditButton === false);
    return showEditButton
        && this.currentFeature()?.layer?.editable
        && this.authenticatedUserDetails()?.isAuthenticated // remove when HTM-1762 is implemented
        && this.editComponentEnabled()
        && !this.in3DView();
  });

  public isWideScreen = signal<boolean>(false);
  public expandedList = signal<boolean>(false);
  public attributesCollapsed = signal<boolean>(false);
  public attachmentsCollapsed = signal<boolean>(false);

  constructor() {
    this.dialogOpen$ = this.store$.select(selectFeatureInfoDialogVisible);
    this.dialogCollapsed$ = this.store$.select(selectFeatureInfoDialogCollapsed);
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

    combineLatest([
      this.dialogOpen$,
      this.isMobileLayoutEnabled$,
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([ dialogOpen, isMobileLayoutEnabled ]) => {
        if (dialogOpen && isMobileLayoutEnabled) {
          this.menuBarService.toggleActiveComponent(BaseComponentTypeEnum.FEATURE_INFO, $localize`:@@core.feature-info.feature-info-menu-item:Feature info`);
          this.menuBarService.setMobilePanelHeight(450);
        }
      });

    combineLatest([
      this.menuBarService.isComponentVisible$(BaseComponentTypeEnum.FEATURE_INFO),
      this.isMobileLayoutEnabled$,
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([ visible, isMobileLayoutEnabled ]) => {
        if (!visible && isMobileLayoutEnabled) {
          this.closeDialog();
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

  public toggleAttachments() {
    this.attachmentsCollapsed.set(!this.attachmentsCollapsed());
  }

  public editFeature() {
    this.store$.select(selectCurrentFeatureForEdit)
      .pipe(take(1))
      .subscribe(featureWithMetadata => {
        if (featureWithMetadata) {
          this.store$.dispatch(setLoadedEditFeature({
            feature: featureWithMetadata.feature,
            columnMetadata: featureWithMetadata.columnMetadata,
            openedFromFeatureInfo: true,
          }));
        }
      });

  }
}
