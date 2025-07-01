import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { selectEditActive, selectSelectedEditLayer } from '../state/edit.selectors';
import { Store } from '@ngrx/store';
import { combineLatest, of, take } from 'rxjs';
import { setEditActive, setEditCreateNewFeatureActive, setSelectedEditLayer } from '../state/edit.actions';
import { FormControl } from '@angular/forms';
import { selectEditableLayers } from '../../../map/state/map.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, withLatestFrom } from 'rxjs/operators';
import { hideFeatureInfoDialog } from '../../feature-info/state/feature-info.actions';
import { ApplicationLayerService } from '../../../map/services/application-layer.service';
import { AttributeType, AuthenticatedUserService, GeometryType } from '@tailormap-viewer/api';
import { activateTool } from '../../toolbar/state/toolbar.actions';
import { ToolbarComponentEnum } from '../../toolbar/models/toolbar-component.enum';

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


  public active$ = this.store$.select(selectEditActive);
  public editableLayers$ = this.store$.select(selectEditableLayers);
  public layer = new FormControl();
  public editGeometryType: GeometryType | null = null;

  private defaultTooltip = $localize `:@@core.edit.edit-feature-tooltip:Edit feature`;
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

  public createFeature(geometryType: string) {
    if (!this.layer.value) {
      return;
    }
    // get layer attribute details for edit form
    this.applicationLayerService.getLayerDetails$(this.layer.value)
      .pipe(take(1))
      .subscribe(layerDetails => {
        // show edit dialog
        this.store$.dispatch(setEditCreateNewFeatureActive({
          active: true,
          geometryType,
          columnMetadata: layerDetails.details.attributes.map(attribute => {
              return {
                layerId: layerDetails.details.id,
                key: attribute.key,
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
      this.createFeature('linestring');
    }
  }

}
