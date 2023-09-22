import { ChangeDetectionStrategy, Component, DestroyRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { ConfirmDialogService, CssHelper } from '@tailormap-viewer/shared';
import {
  selectEditCreateNewFeatureActive,
  selectEditDialogCollapsed,
  selectEditDialogVisible,
  selectEditFeatures,
  selectEditMapCoordinates,
  selectLoadingEditFeatures, selectNewFeatureGeometryType,
  selectSelectedEditFeature,
} from '../state/edit.selectors';
import { combineLatest, concatMap, filter, map, of, switchMap, take } from 'rxjs';
import {
  editNewlyCreatedFeature,
  expandCollapseEditDialog, hideEditDialog, updateEditFeature,
} from '../state/edit.actions';
import { FeatureModelAttributes } from '@tailormap-viewer/api';
import { ApplicationLayerService } from '../../../map/services/application-layer.service';
import { FeatureWithMetadataModel } from '../models/feature-with-metadata.model';
import { EditFeatureService } from '../edit-feature.service';
import { selectViewerId } from '../../../state/core.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MapService } from '@tailormap-viewer/map';
import { ViewerLayoutService } from '../../../services/viewer-layout/viewer-layout.service';

@Component({
  selector: 'tm-edit-dialog',
  templateUrl: './edit-dialog.component.html',
  styleUrls: ['./edit-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditDialogComponent {

  public dialogOpen$;
  public dialogCollapsed$;
  public isCreateFeature$;
  public newGeometryType$;
  public currentFeature$;
  public layerDetails$;
  public selectableFeature$;

  public panelWidth = 300;
  private bodyMargin = CssHelper.getCssVariableValueNumeric('--body-margin');
  public panelWidthMargin = CssHelper.getCssVariableValueNumeric('--menubar-width') + (this.bodyMargin * 2);

  public loadingEditFeatureInfo$;
  public editCoordinates$;

  public updatedAttributes: FeatureModelAttributes | null = null;
  private geometryEditedForLayer: string | null = null;

  public formValid: boolean = false;

  constructor(
    private store$: Store,
    private applicationLayerService: ApplicationLayerService,
    private editFeatureService: EditFeatureService,
    private destroyRef: DestroyRef,
    private mapService: MapService,
    private confirmService: ConfirmDialogService,
    private layoutService: ViewerLayoutService,
  ) {
    this.dialogOpen$ = this.store$.select(selectEditDialogVisible);
    this.dialogCollapsed$ = this.store$.select(selectEditDialogCollapsed);
    this.loadingEditFeatureInfo$ = this.store$.select(selectLoadingEditFeatures);
    this.editCoordinates$ = this.store$.select(selectEditMapCoordinates);
    this.currentFeature$ = this.store$.select(selectSelectedEditFeature);
    this.isCreateFeature$ = this.store$.select(selectEditCreateNewFeatureActive);
    this.newGeometryType$ = this.store$.select(selectNewFeatureGeometryType);
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
        this.resetChanges();
      });

    this.dialogOpen$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(open => {
        this.layoutService.setRightPadding(open ? this.panelWidth + this.bodyMargin : 0);
      });
  }

  private resetChanges() {
    this.updatedAttributes = null;
    this.formValid = false;
    if (this.geometryEditedForLayer) {
      const refreshLayerId = this.geometryEditedForLayer;
      this.mapService.refreshLayer(`${refreshLayerId}`);
      this.geometryEditedForLayer = null;
    }
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
          this.resetChanges();
        }
      });
  }

  public add(layerId: string) {
    const updatedFeature = this.updatedAttributes;
    if (!updatedFeature) {
      return;
    }

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
            this.resetChanges();
          }
        });
  }

  public delete(layerId: string, currentFeature: FeatureWithMetadataModel) {
    this.store$.select(selectViewerId)
      .pipe(
        take(1),
        concatMap(viewerId => {
          if (!viewerId) {
            return of(null);
          }
          return this.confirmService.confirm$(
            $localize `Delete feature`,
            $localize `Are you sure you want to delete this feature? This cannot be undone.`,
            true,
          ).pipe(
            take(1),
            concatMap(confirm => {
              if (!confirm) {
                return of(null);
              }
              return this.editFeatureService.deleteFeature$(viewerId, layerId, {
                __fid: currentFeature.feature.__fid,
                attributes: currentFeature.feature.attributes,
              });
            }),
          );
        }),
      )
      .subscribe(succes => {
        if (succes) {
          this.closeDialog();
          this.mapService.refreshLayer(layerId);
        }
      });
  }

  public featureChanged($event: { attribute: string; value: any; invalid?: boolean }) {
    this.formValid = !$event.invalid;
    this.setAttributeUpdated($event.attribute, $event.value);
  }

  public geometryChanged($event: { __fid: string; geometry: string; geometryAttribute: string }) {
    if (!this.currentFeature$) {
      return;
    }
    this.currentFeature$
      .pipe(take(1))
      .subscribe(feature => {
        if (feature?.feature.__fid !== $event.__fid) {
          return;
        }
        this.geometryEditedForLayer = feature.feature.layerId;
        if (this.updatedAttributes === null) {
          // Edited feature but only geometry edited, set this so Save button is enabled
          this.formValid = true;
        }
        this.setAttributeUpdated($event.geometryAttribute, $event.geometry);
      });
  }

  public geometryCreated($event: { geometry: string }) {
    if (!this.currentFeature$) {
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
          this.setAttributeUpdated(layerDetails.details.geometryAttribute, $event.geometry);
          this.geometryEditedForLayer = layerDetails.layer.id;
        }
      });
  }
}
