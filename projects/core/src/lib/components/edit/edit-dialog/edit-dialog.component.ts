import { ChangeDetectionStrategy, Component, DestroyRef, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { CssHelper } from '@tailormap-viewer/shared';
import {
  selectEditDialogCollapsed,
  selectEditDialogVisible,
  selectEditFeatures,
  selectEditMapCoordinates,
  selectLoadingEditFeatures,
  selectSelectedEditFeature,
} from '../state/edit.selectors';
import { combineLatest, concatMap, filter, map, Observable, of, switchMap, take } from 'rxjs';
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

  public currentFeature$: Observable<FeatureWithMetadataModel | null> | undefined;
  public panelWidthMargin = CssHelper.getCssVariableValueNumeric('--menubar-width') + (CssHelper.getCssVariableValueNumeric('--body-margin') * 2);
  public layerDetails$: Observable<{ layer: AppLayerModel; details: LayerDetailsModel }> | undefined;

  public loadingEditFeatureInfo$ = this.store$.select(selectLoadingEditFeatures);
  public editCoordinates$ = this.store$.select(selectEditMapCoordinates);

  public updatedAttributes: FeatureModelAttributes | null = null;
  public selectableFeature$: Observable<FeatureInfoFeatureModel[]> = of([]);
  private geometryEditedForLayer: string | null = null;

  constructor(
    private store$: Store,
    private applicationLayerService: ApplicationLayerService,
    private editFeatureService: EditFeatureService,
    private destroyRef: DestroyRef,
    private mapService: MapService,
  ) {}

  public ngOnInit(): void {
    this.dialogOpen$ = this.store$.select(selectEditDialogVisible);
    this.dialogCollapsed$ = this.store$.select(selectEditDialogCollapsed);
    this.currentFeature$ = this.store$.select(selectSelectedEditFeature);
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
        this.updatedAttributes = null;
      });
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
          this.updatedAttributes = null;
          if (!this.geometryEditedForLayer) {
            return;
          }
          const refreshLayerId = this.geometryEditedForLayer;
          this.geometryEditedForLayer = null;
          this.mapService.getLayerManager$()
            .pipe(take(1))
            .subscribe(manager => {
              manager.refreshLayer(`${refreshLayerId}`);
            });
        }
      });
  }

  public featureChanged($event: { attribute: string; value: any; invalid?: boolean }) {
    if (this.updatedAttributes === null) {
      this.updatedAttributes = {};
    }
    if ($event.invalid) {
      delete this.updatedAttributes[$event.attribute];
      if (Object.keys(this.updatedAttributes).length === 0) {
        this.updatedAttributes = null;
      }
      return;
    }
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
}
