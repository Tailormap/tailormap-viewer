import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, OnInit, Output } from '@angular/core';
import {
  MapService,
  ModifyToolConfigModel,
  ModifyToolModel,
  ToolTypeEnum,
} from "@tailormap-viewer/map";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { forkJoin, of, switchMap, take, tap } from 'rxjs';
import { FeatureStylingHelper } from "../../../shared/helpers/feature-styling.helper";
import { Store } from "@ngrx/store";
import { ApplicationLayerService } from "../../../map/services/application-layer.service";
import { selectSelectedEditFeature } from '../state/edit.selectors';
import { FeatureInfoFeatureModel } from '../../feature-info/models/feature-info-feature.model';
import { LayerDetailsModel } from '@tailormap-viewer/api';
import { ApplicationStyleService } from '../../../services/application-style.service';

@Component({
  selector: 'tm-edit-geometry-tool',
  templateUrl: './edit-geometry-tool.component.html',
  styleUrls: ['./edit-geometry-tool.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditGeometryToolComponent implements OnInit {

  private tool: ModifyToolModel | null = null;

  private currentFeature: FeatureInfoFeatureModel | null = null;
  private layerDetails: LayerDetailsModel | null = null;

  @Output()
  public geometryChanged = new EventEmitter<{ __fid: string; geometry: string; geometryAttribute: string }>();

  constructor(
    private mapService: MapService,
    private destroyRef: DestroyRef,
    private store$: Store,
    private applicationLayerService: ApplicationLayerService,
  ) { }

  public ngOnInit(): void {
    this.mapService.createTool$<ModifyToolModel, ModifyToolConfigModel>({
      type: ToolTypeEnum.Modify,
      style: FeatureStylingHelper.getDefaultHighlightStyle('edit-geometry-style', {
        fillColor: ApplicationStyleService.getPrimaryColor(),
        fillOpacity: 10,
      }),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(({ tool }) => this.tool = tool),
        switchMap(({ tool }) => tool.featureModified$),
      )
      .subscribe(modifiedGeometry => {
        if (!this.currentFeature || !this.layerDetails) {
          return;
        }
        this.geometryChanged.emit({
          __fid: this.currentFeature.__fid,
          geometryAttribute: this.layerDetails.geometryAttribute,
          geometry: modifiedGeometry,
        });
      });

    this.store$.select(selectSelectedEditFeature)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(selectedFeature => {
          if (!selectedFeature) {
            return of([ null, null ]);
          }
          return forkJoin([
            of(selectedFeature),
            this.applicationLayerService.getLayerDetails$(selectedFeature.feature.layerId).pipe(take(1)),
          ]);
        }),
      )
      .subscribe(([ selectedFeature, layerDetails ]) => {
        if (!selectedFeature || !layerDetails || !this.tool) {
          this.currentFeature = null;
          this.layerDetails = null;
          this.tool?.disable();
          return;
        }
        this.currentFeature = selectedFeature.feature;
        this.layerDetails = layerDetails.details;
        const geometry = selectedFeature.feature.attributes[layerDetails.details.geometryAttribute];
        this.tool.enable({ geometry });
      });
  }

}
