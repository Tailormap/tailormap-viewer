import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy, EventEmitter, Output } from '@angular/core';
import { AppLayerSettingsModel, AppTreeLayerNodeModel } from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { selectSelectedApplicationLayerSettings } from '../state/application.selectors';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { TreeModel } from '@tailormap-viewer/shared';
import { ExtendedGeoServiceModel } from '../../catalog/models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../../catalog/models/extended-geo-service-layer.model';
import { ExtendedGeoServiceAndLayerModel } from '../../catalog/models/extended-geo-service-and-layer.model';
import { GeoServiceFormDialogComponent } from '../../catalog/geo-service-form-dialog/geo-service-form-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { GeoServiceLayerFormDialogComponent } from '../../catalog/geo-service-layer-form-dialog/geo-service-layer-form-dialog.component';

@Component({
  selector: 'tm-admin-application-layer-settings',
  templateUrl: './application-layer-settings.component.html',
  styleUrls: ['./application-layer-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationLayerSettingsComponent implements OnInit, OnDestroy {

  private _node: TreeModel<AppTreeLayerNodeModel> | null = null;
  private destroyed = new Subject();
  private layerSettings: Record<string, AppLayerSettingsModel> = {};

  @Input()
  public set node(node: TreeModel<AppTreeLayerNodeModel> | null) {
    this._node = node;
    this.initForm(this._node);
  }
  public get node(): TreeModel<AppTreeLayerNodeModel> | null {
    return this._node;
  }

  @Input()
  public serviceLayer: ExtendedGeoServiceAndLayerModel | null = null;

  @Output()
  public layerSettingsChange = new EventEmitter<{ nodeId: string; settings: AppLayerSettingsModel | null }>();

  public layerSettingsForm = new FormGroup({
    title: new FormControl<string | null>(null),
    opacity: new FormControl<number>(100, { nonNullable: true }),
  });

  constructor(
    private store$: Store,
    private dialog: MatDialog,
    private adminSnackbarService: AdminSnackbarService,
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
        const settings = value
          ? { title: value.title || undefined, opacity: value.opacity }
          : null;
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
    }, { emitEvent: false });
  }

  public updateGeoServiceSetting($event: MouseEvent, geoService: ExtendedGeoServiceModel) {
    $event.preventDefault();
    GeoServiceFormDialogComponent.open(this.dialog, {
      geoService,
      parentNode: geoService.catalogNodeId,
    }).afterClosed().pipe(takeUntil(this.destroyed)).subscribe(updatedService => {
      if (updatedService) {
        this.adminSnackbarService.showMessage($localize `Service ${updatedService.title} updated`);
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
        this.adminSnackbarService.showMessage($localize `Layer settings updated`);
      }
    });
  }

}
