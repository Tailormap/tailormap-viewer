import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { ConfirmDialogService, CssHelper } from '@tailormap-viewer/shared';
import {
  selectEditCreateNewFeatureActive,
  selectEditDialogCollapsed,
  selectEditDialogVisible,
  selectEditFeatures,
  selectEditMapCoordinates,
  selectLoadingEditFeatures,
  selectSelectedEditFeature,
} from '../state/edit.selectors';
import { combineLatest, concatMap, filter, map, of, switchMap, take } from 'rxjs';
import {
  editNewlyCreatedFeature,
  expandCollapseEditDialog, hideEditDialog,  updateEditFeature,
} from '../state/edit.actions';
import { FeatureModelAttributes, UniqueValuesService } from '@tailormap-viewer/api';
import { ApplicationLayerService } from '../../../map/services/application-layer.service';
import { FeatureWithMetadataModel } from '../models/feature-with-metadata.model';
import { EditFeatureService } from '../services/edit-feature.service';
import { selectViewerId } from '../../../state/core.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EditMapToolService } from '../services/edit-map-tool.service';
import { FeatureUpdatedService } from '../../../services/feature-updated.service';
import { hideFeatureInfoDialog } from '../../feature-info/state/feature-info.actions';

@Component({
  selector: 'tm-edit-dialog',
  templateUrl: './edit-dialog.component.html',
  styleUrls: ['./edit-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EditDialogComponent {

  public dialogOpen$;
  public dialogCollapsed$;
  public isCreateFeature$;
  public currentFeature$;
  public layerDetails$;
  public selectableFeature$;

  public creatingSavingFeature = signal(false);
  public removingFeature = signal(false);

  public panelWidth = 300;
  private bodyMargin = CssHelper.getCssVariableValueNumeric('--body-margin');
  public panelWidthMargin = CssHelper.getCssVariableValueNumeric('--menubar-width') + (this.bodyMargin * 2);

  public loadingEditFeatureInfo$;
  public editCoordinates$;

  public updatedAttributes: FeatureModelAttributes | null = null;

  public formValid: boolean = false;

  private clearCacheValuesAfterSave = new Set<string>();

  constructor(
    private store$: Store,
    private editMapToolService: EditMapToolService,
    private applicationLayerService: ApplicationLayerService,
    private editFeatureService: EditFeatureService,
    private destroyRef: DestroyRef,
    private featureUpdatedService: FeatureUpdatedService,
    private confirmService: ConfirmDialogService,
    private uniqueValuesService: UniqueValuesService,
    private cdr: ChangeDetectorRef,
  ) {
    this.dialogOpen$ = this.store$.select(selectEditDialogVisible);
    this.dialogCollapsed$ = this.store$.select(selectEditDialogCollapsed);
    this.loadingEditFeatureInfo$ = this.store$.select(selectLoadingEditFeatures);
    this.editCoordinates$ = this.store$.select(selectEditMapCoordinates);
    this.currentFeature$ = this.store$.select(selectSelectedEditFeature);
    this.isCreateFeature$ = this.store$.select(selectEditCreateNewFeatureActive);
    this.selectableFeature$ = combineLatest([
      this.store$.select(selectEditFeatures),
      this.store$.select(selectSelectedEditFeature),
    ]).pipe(
        map(([ features, selectedFeature ]) => {
          if (selectedFeature) {
            return [];
          }
          return features;
        }),
    );
    this.layerDetails$ = this.currentFeature$
      .pipe(
        filter((feature): feature is FeatureWithMetadataModel => !!feature),
        switchMap(feature => {
          return this.applicationLayerService.getLayerDetails$(feature.feature.layerId);
        }),
      );
    this.currentFeature$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.store$.dispatch(hideFeatureInfoDialog());
        this.resetChanges();
      });

    this.editMapToolService.editedGeometry$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(geometry => {
      this.geometryChanged(geometry, false);
    });
    this.editMapToolService.createdGeometry$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(geometry => {
      this.geometryChanged(geometry, true);
    });
  }

  private resetChanges() {
    this.updatedAttributes = null;
    this.formValid = false;
    this.clearCacheValuesAfterSave = new Set();
  }

  private setAttributeUpdated(attribute: string, value: any) {
    if (this.updatedAttributes === null) {
      this.updatedAttributes = {};
    }
    this.updatedAttributes[attribute] = value;
}

  public closeDialog() {
    this.store$.dispatch(hideEditDialog());
  }

  public expandCollapseDialog() {
    this.store$.dispatch(expandCollapseEditDialog());
  }

  public save(layerId: string, currentFeature: FeatureWithMetadataModel) {
    const updatedFeature = this.updatedAttributes;
    if (!updatedFeature) {
      return;
    }
    this.uniqueValuesService.clearCaches(Array.from(this.clearCacheValuesAfterSave));
    this.creatingSavingFeature.set(true);
    this.store$.select(selectViewerId)
      .pipe(
        take(1),
        concatMap(viewerId => {
          if (!viewerId) {
            return of(null);
          }
          return this.editFeatureService.updateFeature$(viewerId, layerId, {
            __fid: currentFeature.feature.__fid,
            attributes: updatedFeature,
          });
        }),
      )
      .subscribe(feature => {
        if (feature) {
          this.store$.dispatch(updateEditFeature({ feature, layerId }));
          this.featureUpdatedService.updatedFeature(layerId, feature.__fid);
          this.resetChanges();
        }
        this.creatingSavingFeature.set(false);
      });
  }

  public add(layerId: string) {
    const updatedFeature = this.updatedAttributes;
    if (!updatedFeature) {
      return;
    }
    this.creatingSavingFeature.set(true);
    this.store$.select(selectViewerId)
        .pipe(
            take(1),
            concatMap(viewerId => {
              if (!viewerId) {
                return of(null);
              }
              return this.editFeatureService.createFeature$(viewerId, layerId, {
                __fid: '',
                attributes: updatedFeature,
              });
            }),
        )
        .subscribe(feature => {
          if (feature) {
            this.store$.dispatch(editNewlyCreatedFeature({ feature: { ...feature, layerId } }));
            this.featureUpdatedService.updatedFeature(layerId, feature.__fid);
            this.resetChanges();
          }
          this.creatingSavingFeature.set(false);
        });
  }

  public delete(layerId: string, currentFeature: FeatureWithMetadataModel) {
    this.removingFeature.set(true);
    const featureId = currentFeature.feature.__fid;
    this.store$.select(selectViewerId)
      .pipe(
        take(1),
        concatMap(viewerId => {
          if (!viewerId) {
            return of(null);
          }
          return this.confirmService.confirm$(
            $localize `:@@core.edit.delete-feature-confirm:Delete feature`,
            $localize `:@@core.edit.delete-feature-confirm-message:Are you sure you want to delete this feature? This cannot be undone.`,
            true,
          ).pipe(
            take(1),
            concatMap(confirm => {
              if (!confirm) {
                return of(null);
              }
              return this.editFeatureService.deleteFeature$(viewerId, layerId, {
                __fid: featureId,
                attributes: currentFeature.feature.attributes,
              });
            }),
          );
        }),
      )
      .subscribe(succes => {
        if (succes) {
          this.featureUpdatedService.updatedFeature(layerId, featureId);
          this.closeDialog();
        }
        this.removingFeature.set(false);
      });
  }

  public featureChanged($event: { attribute: string; value: any; invalid?: boolean }) {
    this.formValid = !$event.invalid;
    this.setAttributeUpdated($event.attribute, $event.value);
  }

  public geometryChanged(geometry: string | null, newFeature: boolean) {
    if (!this.currentFeature$ || geometry === null) {
      return;
    }
    this.currentFeature$.pipe(
      take(1),
      switchMap((feature: FeatureWithMetadataModel | null) => {
        if (!feature) {
          return of(null);
        }
        return this.applicationLayerService.getLayerDetails$(feature.feature.layerId);
      }))
      .subscribe(layerDetails => {
        if (layerDetails) {
          if (!newFeature && this.updatedAttributes === null) {
            // Edited feature but only geometry edited, set this so Save button is enabled
            this.formValid = true;
            this.cdr.detectChanges();
          }
          this.setAttributeUpdated(layerDetails.details.geometryAttribute, geometry);
        }
      });
  }

  public clearUniqueValuesCacheAfterSave(uniqueValueCacheKey: string) {
    this.clearCacheValuesAfterSave.add(uniqueValueCacheKey);
  }

}
