import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AppLayerSettingsModel, AppTreeLayerNodeModel, FeatureSourceModel } from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { selectSelectedApplicationLayerSettings } from '../state/application.selectors';
import { debounceTime, map, Observable, of, Subject, switchMap, take, takeUntil } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { TreeModel } from '@tailormap-viewer/shared';
import { ExtendedGeoServiceModel } from '../../catalog/models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../../catalog/models/extended-geo-service-layer.model';
import { ExtendedGeoServiceAndLayerModel } from '../../catalog/models/extended-geo-service-and-layer.model';
import { GeoServiceFormDialogComponent } from '../../catalog/geo-service-form-dialog/geo-service-form-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { GeoServiceLayerFormDialogComponent } from '../../catalog/geo-service-layer-form-dialog/geo-service-layer-form-dialog.component';
import { CatalogDataService } from '../../catalog/services/catalog-data.service';
import { FeatureTypeFormDialogComponent } from '../../catalog/feature-type-form-dialog/feature-type-form-dialog.component';
import { ExtendedFeatureTypeModel } from '../../catalog/models/extended-feature-type.model';
import { selectFeatureSourceAndFeatureTypesById } from '../../catalog/state/catalog.selectors';

type FeatureSourceAndType = { featureSource: FeatureSourceModel; featureType: ExtendedFeatureTypeModel | null };

@Component({
  selector: 'tm-admin-application-layer-settings',
  templateUrl: './application-layer-settings.component.html',
  styleUrls: ['./application-layer-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationLayerSettingsComponent implements OnInit, OnDestroy {

  private _node: TreeModel<AppTreeLayerNodeModel> | null = null;
  private _serviceLayer: ExtendedGeoServiceAndLayerModel | null = null;

  private destroyed = new Subject();
  private layerSettings: Record<string, AppLayerSettingsModel> = {};

  // eslint-disable-next-line max-len
  private editingDisabledTooltip = $localize `:@@admin-core.application.layer-not-editable:This layer cannot be edited because there is no writeable feature source / type configured for this layer`;
  public editableTooltip = this.editingDisabledTooltip;

  @Input()
  public set node(node: TreeModel<AppTreeLayerNodeModel> | null) {
    this._node = node;
    this.initForm(this._node);
  }
  public get node(): TreeModel<AppTreeLayerNodeModel> | null {
    return this._node;
  }

  @Input()
  public set serviceLayer(serviceLayer: ExtendedGeoServiceAndLayerModel | null) {
    this._serviceLayer = serviceLayer;
    this.initFeatureSource(serviceLayer);
  }
  public get serviceLayer(): ExtendedGeoServiceAndLayerModel | null {
    return this._serviceLayer;
  }

  public featureSourceAndType$: Observable<FeatureSourceAndType | null> = of(null);

  @Output()
  public layerSettingsChange = new EventEmitter<{ nodeId: string; settings: AppLayerSettingsModel | null }>();

  public layerSettingsForm = new FormGroup({
    title: new FormControl<string | null>(null),
    opacity: new FormControl<number>(100, { nonNullable: true }),
    attribution: new FormControl<string | null>(null),
    description: new FormControl<string | null>(null),
    editable: new FormControl<boolean>(false),
  });

  constructor(
    private store$: Store,
    private dialog: MatDialog,
    private adminSnackbarService: AdminSnackbarService,
    private catalogDataService: CatalogDataService,
  ) { }

  public ngOnInit(): void {
    this.store$.select(selectSelectedApplicationLayerSettings)
      .pipe(takeUntil(this.destroyed))
      .subscribe(layerSettings => {
        this.layerSettings = layerSettings;
        this.initForm(this.node);
      });

    this.layerSettingsForm.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        debounceTime(250),
      )
      .subscribe(value => {
        if (!this.node) {
          return;
        }
        const settings = !value ? null : {
          title: value.title || undefined,
          opacity: value.opacity,
          attribution: value.attribution,
          description: value.description,
          editable: value.editable ?? undefined,
        };
        this.layerSettingsChange.emit({ nodeId: this.node.id, settings });
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private initForm(node?: TreeModel<AppTreeLayerNodeModel> | null) {
    if (!node) {
      this.layerSettingsForm.patchValue({ title: null, opacity: 100 }, { emitEvent: false });
      return;
    }
    const nodeSettings = this.layerSettings[node.id] || {};
    this.layerSettingsForm.patchValue({
      title: nodeSettings.title || null,
      opacity: nodeSettings.opacity || 100,
      attribution: nodeSettings.attribution || null,
      description: nodeSettings.description || null,
      editable: nodeSettings.editable ?? false,
    }, { emitEvent: false });
  }

  public updateGeoServiceSetting($event: MouseEvent, geoService: ExtendedGeoServiceModel) {
    $event.preventDefault();
    GeoServiceFormDialogComponent.open(this.dialog, {
      geoService,
      parentNode: geoService.catalogNodeId,
    }).afterClosed().pipe(takeUntil(this.destroyed)).subscribe(updatedService => {
      if (updatedService) {
        this.adminSnackbarService.showMessage($localize `:@@admin-core.application.service-updated:Service ${updatedService.title} updated`);
      }
    });
  }

  public updateGeoServiceLayerSetting($event: MouseEvent, geoService: ExtendedGeoServiceModel, geoServiceLayer: ExtendedGeoServiceLayerModel) {
    $event.preventDefault();
    GeoServiceLayerFormDialogComponent.open(this.dialog, {
      geoService,
      geoServiceLayer,
    }).afterClosed().pipe(takeUntil(this.destroyed)).subscribe(updatedSettings => {
      if (updatedSettings) {
        this.adminSnackbarService.showMessage($localize `:@@admin-core.application.layer-settings-updated:Layer settings updated`);
      }
    });
  }

  public updateFeatureTypeSetting($event: MouseEvent, featureSource: FeatureSourceAndType | null) {
    $event.preventDefault();
    if (!featureSource || !featureSource.featureType) {
      return;
    }
    FeatureTypeFormDialogComponent.open(this.dialog, { featureType: featureSource.featureType }).afterClosed()
      .pipe(takeUntil(this.destroyed)).subscribe(updatedFeatureType => {
        if (updatedFeatureType) {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.feature-type-settings-updated:Feature type settings updated`);
        }
      });
  }

  private initFeatureSource(serviceLayer: ExtendedGeoServiceAndLayerModel | null) {
    if (!serviceLayer || typeof serviceLayer.layerSettings?.featureType?.featureSourceId === "undefined") {
      this.featureSourceAndType$ = of(null);
      return;
    }
    const featureSourceId = `${serviceLayer.layerSettings?.featureType?.featureSourceId}`;
    this.featureSourceAndType$ = this.catalogDataService.getFeatureSourceById$(featureSourceId)
      .pipe(
        switchMap(() => {
          return this.store$.select(selectFeatureSourceAndFeatureTypesById(featureSourceId));
        }),
        map(featureSource => {
          if (!featureSource) {
            return null;
          }
          return {
            featureSource,
            featureType: featureSource.featureTypes.find(ft => ft.name === serviceLayer.layerSettings?.featureType?.featureTypeName) || null,
          };
        }),
      );
    this.updateIsEditable();
  }

  private updateIsEditable() {
    this.featureSourceAndType$
      .pipe(take(1))
      .subscribe((fs) => {
        if (!fs) {
          return;
        }
        this.toggleEditableEnabled(fs.featureType?.writeable);
      });
  }

  private toggleEditableEnabled(enabled?: boolean) {
    this.editableTooltip = enabled ? '' : this.editingDisabledTooltip;
    if (enabled) {
      this.layerSettingsForm.get('editable')?.enable({ emitEvent: false });
    } else {
      this.layerSettingsForm.get('editable')?.disable({ emitEvent: false });
    }
  }

}
