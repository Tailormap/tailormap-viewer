import { ChangeDetectionStrategy, Component, DestroyRef, OnInit } from '@angular/core';
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
import { combineLatest, concatMap, filter, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { expandCollapseEditDialog, hideEditDialog, updateEditFeature } from '../state/edit.actions';
import { AppLayerModel, FeatureModelAttributes, LayerDetailsModel } from '@tailormap-viewer/api';
import { ApplicationLayerService } from '../../../map/services/application-layer.service';
import { FeatureWithMetadataModel } from '../models/feature-with-metadata.model';
import { EditFeatureService } from '../edit-feature.service';
import { selectViewerId } from '../../../state/core.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FeatureInfoFeatureModel } from "../../feature-info/models/feature-info-feature.model";
import { MapService } from '@tailormap-viewer/map';

@Component({
  selector: 'tm-edit-dialog',
  templateUrl: './edit-dialog.component.html',
  styleUrls: ['./edit-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditDialogComponent implements OnInit {

  public dialogOpen$: Observable<boolean> = of(false);
  public dialogCollapsed$: Observable<boolean> = of(false);
  public isCreateFeature$: Observable<boolean> = of(false);
  public currentFeature$: Observable<FeatureWithMetadataModel | null> | undefined;
  public panelWidthMargin = CssHelper.getCssVariableValueNumeric('--menubar-width') + (CssHelper.getCssVariableValueNumeric('--body-margin') * 2);
  public layerDetails$: Observable<{ layer: AppLayerModel; details: LayerDetailsModel }> | undefined;

  public loadingEditFeatureInfo$ = this.store$.select(selectLoadingEditFeatures);
  public editCoordinates$ = this.store$.select(selectEditMapCoordinates);

  public updatedAttributes: FeatureModelAttributes = {};
  public selectableFeature$: Observable<FeatureInfoFeatureModel[]> = of([]);
  private geometryEditedForLayer: string | null = null;

  public formValid: boolean = false;

  constructor(
    private store$: Store,
    private applicationLayerService: ApplicationLayerService,
    private editFeatureService: EditFeatureService,
    private destroyRef: DestroyRef,
    private mapService: MapService,
    private confirmService: ConfirmDialogService,
  ) {}

  public ngOnInit(): void {
    this.dialogOpen$ = this.store$.select(selectEditDialogVisible);
    this.dialogCollapsed$ = this.store$.select(selectEditDialogCollapsed);
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
        this.resetChanges();
      });
  }

  private resetChanges() {
    this.updatedAttributes = {};
    this.formValid = false;
    if (this.geometryEditedForLayer) {
      const refreshLayerId = this.geometryEditedForLayer;
      this.mapService.refreshLayer(`${refreshLayerId}`);
      this.geometryEditedForLayer = null;
    }
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
    console.log('add', updatedFeature);
    this.currentFeature$?.pipe(
        tap(feature => console.log('feature tap', feature)),
        take(1),
    ).subscribe((feature) => { console.log('feature take', feature); });

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
            this.store$.dispatch(updateEditFeature({ feature, layerId }));
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
    this.updatedAttributes[$event.attribute] = $event.value;
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
          this.updatedAttributes = {};
        }
        this.updatedAttributes[$event.geometryAttribute] = $event.geometry;
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
          this.updatedAttributes[layerDetails.details.geometryAttribute] = $event.geometry;
        }
      });
  }
}
