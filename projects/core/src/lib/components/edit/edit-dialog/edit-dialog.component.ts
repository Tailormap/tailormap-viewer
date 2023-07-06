import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { CssHelper } from '@tailormap-viewer/shared';
import {
  selectEditDialogCollapsed, selectEditDialogVisible, selectEditMapCoordinates, selectLoadingEditFeatures, selectSelectedEditFeature,
} from '../state/edit.selectors';
import { concatMap, filter, Observable, of, switchMap, take } from 'rxjs';
import { expandCollapseEditDialog, hideEditDialog, updateEditFeature } from '../state/edit.actions';
import { AppLayerModel, FeatureModel, LayerDetailsModel } from '@tailormap-viewer/api';
import { ApplicationLayerService } from '../../../map/services/application-layer.service';
import { FeatureWithMetadataModel } from '../models/feature-with-metadata.model';
import { EditFeatureService } from '../edit-feature.service';
import { selectViewerId } from '../../../state/core.selectors';

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

  public updatedFeature: FeatureModel | null = null;

  constructor(
    private store$: Store,
    private applicationLayerService: ApplicationLayerService,
    private editFeatureService: EditFeatureService,
  ) {}

  public ngOnInit(): void {
    this.dialogOpen$ = this.store$.select(selectEditDialogVisible);
    this.dialogCollapsed$ = this.store$.select(selectEditDialogCollapsed);
    this.currentFeature$ = this.store$.select(selectSelectedEditFeature);
    this.layerDetails$ = this.currentFeature$
      .pipe(
        filter((feature): feature is FeatureWithMetadataModel => !!feature),
        switchMap(feature => {
          return this.applicationLayerService.getLayerDetails$(feature.feature.layerId);
        }),
      );
  }

  public closeDialog() {
    this.store$.dispatch(hideEditDialog());
  }

  public expandCollapseDialog() {
    this.store$.dispatch(expandCollapseEditDialog());
  }

  public save(layerId: string) {
    const updatedFeature = this.updatedFeature;
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
          return this.editFeatureService.updateFeature$(viewerId, layerId, updatedFeature);
        }),
      )
      .subscribe(feature => {
        if (feature) {
          this.store$.dispatch(updateEditFeature({ feature, layerId }));
          this.updatedFeature = null;
        }
      });
  }

  public featureChanged($event: FeatureModel | null) {
    this.updatedFeature = $event;
  }

}
