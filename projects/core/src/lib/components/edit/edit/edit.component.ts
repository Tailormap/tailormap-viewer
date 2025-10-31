import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import {
  selectCopiedFeatures,
  selectEditActive, selectEditCopyOtherLayerFeaturesActive, selectEditCreateNewFeatureActive, selectSelectedCopyLayer,
  selectSelectedEditLayer,
} from '../state/edit.selectors';
import { Store } from '@ngrx/store';
import { combineLatest, map, of, take } from 'rxjs';
import {
  setEditActive, setEditCopyOtherLayerFeaturesActive, setEditCopyOtherLayerFeaturesDisabled, setEditCreateNewFeatureActive,
  setSelectedEditLayer,
} from '../state/edit.actions';
import { FormControl } from '@angular/forms';
import { selectEditableLayers, selectOrderedVisibleLayersWithServices } from '../../../map/state/map.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, withLatestFrom } from 'rxjs/operators';
import { hideFeatureInfoDialog } from '../../feature-info/state/feature-info.actions';
import { ApplicationLayerService } from '../../../map/services/application-layer.service';
import { AppLayerModel, AttributeType, AuthenticatedUserService, GeometryType } from '@tailormap-viewer/api';
import { activateTool } from '../../toolbar/state/toolbar.actions';
import { ToolbarComponentEnum } from '../../toolbar/models/toolbar-component.enum';
import { DrawingType, MapService, ScaleHelper } from '@tailormap-viewer/map';

@Component({
  selector: 'tm-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EditComponent implements OnInit {
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);
  private applicationLayerService = inject(ApplicationLayerService);
  private authenticatedUserService = inject(AuthenticatedUserService);
  private mapService = inject(MapService);

  public active$ = this.store$.select(selectEditActive);
  public createNewFeatureActive$ = this.store$.select(selectEditCreateNewFeatureActive);
  public copyActive$ = this.store$.select(selectEditCopyOtherLayerFeaturesActive);
  public copiedFeaturesCount$ = this.store$.select(selectCopiedFeatures).pipe(map(features => features.length));
  public selectedCopyLayer$ = this.store$.select(selectSelectedCopyLayer);
  public editableLayers$ = this.store$.select(selectEditableLayers);
  public layer = new FormControl();
  public editGeometryType: GeometryType | null = null;

  public layersToCreateNewFeaturesFrom = signal<AppLayerModel[]>([]);

  private defaultTooltip = $localize `:@@core.edit.edit:Edit feature`;
  private notLoggedInTooltip = $localize `:@@core.edit.require-login-tooltip:You must be logged in to edit.`;
  private noLayersTooltip = $localize `:@@core.edit.no-editable-layers-tooltip:There are no editable layers. Enable a layer to start editing.`;

  public tooltip = this.defaultTooltip;
  public disabled = false;

  public ngOnInit(): void {
    this.store$.select(selectSelectedEditLayer)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(layer => {
        this.layer.setValue(layer, { emitEvent: false });
      });
    this.layer.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(layerId => layerId ? this.applicationLayerService.getLayerDetails$(layerId) : of(null)))
      .subscribe(layerDetails => {
        this.store$.dispatch(setSelectedEditLayer({ layer: layerDetails ? layerDetails.layer.id : null }));
        this.editGeometryType = layerDetails ? layerDetails.details.geometryType : null;
      });
    combineLatest([
      this.active$,
      this.editableLayers$,
      this.authenticatedUserService.getUserDetails$(),
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        withLatestFrom(this.store$.select(selectSelectedEditLayer)),
      )
      .subscribe(([[ active, editableLayers, userDetails ], selectedLayer ]) => {
        this.toggleTooltipDisabled(userDetails.isAuthenticated, editableLayers.length);
        if (active && editableLayers.length === 1 && (!selectedLayer || !editableLayers.some(layer => layer.id === selectedLayer))) {
          this.layer.setValue(editableLayers[0].id);
        }
        if (active && editableLayers.length === 0) {
          this.toggle(true);
        }
      });

    combineLatest([ this.store$.select(selectSelectedEditLayer),
      this.store$.select(selectOrderedVisibleLayersWithServices),
      this.mapService.getMapViewDetails$() ]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(([ selectedEditLayerId, visibleLayers, mapViewDetails ]) => {
      const layers = selectedEditLayerId == null ? [] : visibleLayers.filter(layer =>
        layer.id !== selectedEditLayerId
        && ScaleHelper.isInScale(mapViewDetails.scale, layer.minScale, layer.maxScale));
      this.layersToCreateNewFeaturesFrom.set(layers);
    });
  }

  public isLine() {
    return this.editGeometryType === 'linestring' || this.editGeometryType === 'multilinestring';
  }

  public isPoint() {
    return this.editGeometryType === 'point' || this.editGeometryType === 'multipoint';
  }

  public isPolygon() {
    return this.editGeometryType === 'polygon' || this.editGeometryType === 'multipolygon';
  }

  private toggleTooltipDisabled(isAuthenticated: boolean, editableLayerCount: number) {
    if (!isAuthenticated) {
      this.tooltip = this.notLoggedInTooltip;
      this.disabled = true;
      return;
    }
    if (editableLayerCount === 0) {
      this.tooltip = this.noLayersTooltip;
      this.disabled = true;
      return;
    }
    this.tooltip = this.defaultTooltip;
    this.disabled = false;
  }

  public toggle(close?: boolean) {
    if (close) {
      this.store$.dispatch(setEditActive({ active: false }));
      return;
    }
    this.store$.select(selectEditActive)
      .pipe(take(1))
      .subscribe(active => {
        const editActive = !active; // toggle
        this.store$.dispatch(setEditActive({ active: editActive }));
        if (editActive) {
          this.store$.dispatch(hideFeatureInfoDialog());
          this.store$.dispatch(activateTool({ tool: ToolbarComponentEnum.EDIT, preventMapToolActivation: true }));
        }
      });
  }

  public createFeature(geometryType: DrawingType) {
    if (!this.layer.value) {
      return;
    }

    this.applicationLayerService.getLayerDetails$(this.layer.value).pipe(take(1)).subscribe(layerDetails => {
      this.store$.dispatch(setEditCreateNewFeatureActive({
        active: true,
        geometryType,
        columnMetadata: layerDetails.details.attributes.map(attribute => {
            return {
              layerId: layerDetails.details.id,
              name: attribute.name,
              type: attribute.type as unknown as AttributeType,
              alias: attribute.editAlias,
            };
          },
        ),
      }));
    });
  }

  public createFeatureIfSingleGeometryType() {
    if (this.isPoint()) {
      this.createFeature('point');
    }
    if (this.isLine()) {
      this.createFeature('line');
    }
  }

  public createFeatureFromLayer(id: string) {

    this.selectedCopyLayer$.pipe(take(1)).subscribe(selectedCopyLayer => {
      if (id == selectedCopyLayer) {
        this.store$.dispatch(setEditCopyOtherLayerFeaturesDisabled());
        return;
      }

      this.applicationLayerService.getLayerDetails$(this.layer.value).pipe(take(1)).subscribe(layerDetails => {
        this.store$.dispatch(setEditCopyOtherLayerFeaturesActive({
          layerId: id,
          columnMetadata: layerDetails.details.attributes.map(attribute => {
              return {
                layerId: layerDetails.details.id,
                name: attribute.name,
                type: attribute.type as unknown as AttributeType,
                alias: attribute.editAlias,
              };
            },
          ),
        }));
      });
    });
  }
}
