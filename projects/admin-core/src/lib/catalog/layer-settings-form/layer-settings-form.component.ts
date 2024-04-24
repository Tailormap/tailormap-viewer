import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { debounceTime, map, Observable, of, Subject, takeUntil, tap } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import {
  AuthorizationRuleGroup, GeoServiceProtocolEnum, GroupModel, LayerSettingsModel, LayerSettingsWmsModel, LayerSettingsXyzModel,
} from '@tailormap-admin/admin-api';
import { ComparableValuesArray, FormHelper } from '../../helpers/form.helper';
import { TypesHelper } from '@tailormap-viewer/shared';
import { GroupService } from '../../user/services/group.service';
import { Store } from '@ngrx/store';
import { selectGeoServiceById, selectGeoServiceLayersByGeoServiceId } from '../state/catalog.selectors';
import { BoundsModel, TileLayerHiDpiModeEnum } from '@tailormap-viewer/api';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';

@Component({
  selector: 'tm-admin-layer-settings-form',
  templateUrl: './layer-settings-form.component.html',
  styleUrls: ['./layer-settings-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerSettingsFormComponent implements OnInit {

  private destroyed = new Subject();
  private _layerSettings: LayerSettingsModel | null | undefined;
  private _isLayerSpecific = false;
  private _serviceId: string | undefined = undefined;

  @Input()
  public set protocol(protocol: GeoServiceProtocolEnum) {
    this.isWMS = protocol === GeoServiceProtocolEnum.WMS;
    this.isWMTS = protocol === GeoServiceProtocolEnum.WMTS;
    this.isXYZ = protocol === GeoServiceProtocolEnum.XYZ;
    this.isTILESET3D = protocol === GeoServiceProtocolEnum.TILESET3D;
  }

  @Input()
  public set isLayerSpecific(isLayerSpecific: boolean | undefined) {
    this._isLayerSpecific = !!isLayerSpecific;
    this.patchForm();
  }
  public get isLayerSpecific() {
    return this._isLayerSpecific;
  }

  @Input()
  public set serviceId(serviceId: string | undefined) {
    this._serviceId = serviceId;

    if (serviceId === undefined) {
      this.geoServiceAuthorizations$ = of([]);
      this.layers$ = of([]);
      this.xyzProjection$ = of('');
    } else {
      this.geoServiceAuthorizations$ = this.store$.select(selectGeoServiceById(serviceId)).pipe(takeUntil(this.destroyed), map((settings) => settings?.authorizationRules ?? []));
      this.layers$ = this.store$.select(selectGeoServiceLayersByGeoServiceId(serviceId)).pipe(takeUntil(this.destroyed));
      this.xyzProjection$ = this.store$.select(selectGeoServiceById(serviceId)).pipe(takeUntil(this.destroyed), map((settings) => settings?.settings?.xyzCrs ?? ''));
    }
  }
  public get serviceId() {
    return this._serviceId;
  }

  @Input()
  public set layerSettings(layerSettings: LayerSettingsModel | null | undefined) {
    this._layerSettings = layerSettings;
    this.patchForm();
  }
  public get layerSettings() {
    return this._layerSettings;
  }

  @Input()
  public isLeaf: boolean | null = null;

  @Input()
  public layerName: string | null | undefined;

  @Output()
  public changed = new EventEmitter<LayerSettingsModel | null>();

  public groups$: Observable<GroupModel[]>;

  public geoServiceAuthorizations$: Observable<AuthorizationRuleGroup[]> = of([]);
  public layers$: Observable<ExtendedGeoServiceLayerModel[]> = of([]);
  public xyzProjection$: Observable<string> = of('');

  public isWMS = false;
  public isWMTS = false;
  public isXYZ = false;
  public isTILESET3D = false;
  public hiDpiModes = TileLayerHiDpiModeEnum;


  public layerSettingsForm = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    description: new FormControl<string | null>(null),
    attribution: new FormControl<string | null>(null),
    featureSourceId: new FormControl<number | null>(null),
    featureTypeName: new FormControl<string | null>(null),
    hiDpiEnabled: new FormControl<boolean | null>(null),
    tilingEnabled: new FormControl<boolean | null>(null),
    tilingGutter: new FormControl<number | null>(null),
    hiDpiMode: new FormControl<TileLayerHiDpiModeEnum | null>(null),
    hiDpiSubstituteLayer: new FormControl<string | null>(null),
    minZoom: new FormControl<number | null>(null),
    maxZoom: new FormControl<number | null>(null),
    tileGridExtent: new FormControl<BoundsModel | null>(null),
    tileSize: new FormControl<number | null>(null),
    authorizationRules: new FormControl<AuthorizationRuleGroup[]>([]),
  });

  constructor(groupDetailsService: GroupService, private store$: Store) {
    this.groups$ = groupDetailsService.getGroups$();
  }

  public ngOnInit(): void {
    this.layerSettingsForm.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        tap(() => this.updateDisabledState()),
        debounceTime(250),
      )
      .subscribe(value => {
        if (!this.isValidForm()) {
          this.changed.emit(null);
          return;
        }
        this.changed.emit(this.getUpdatedLayerSettings(value));
      });
  }

  private getUpdatedLayerSettings(value: Partial<typeof this.layerSettingsForm.value>): LayerSettingsModel {
    const settings: LayerSettingsModel = {
      hiDpiDisabled: LayerSettingsFormComponent.getInverseBooleanOrDefault(value.hiDpiEnabled, undefined),
      attribution: value.attribution || undefined,
      description: value.description || undefined,
    };
    if (this.isLayerSpecific) {
      settings.title = value.title || undefined;
      settings.hiDpiMode = value.hiDpiMode || undefined;
      settings.hiDpiSubstituteLayer = value.hiDpiSubstituteLayer || undefined;
      settings.authorizationRules = value?.authorizationRules ?? [];
      if (TypesHelper.isDefined(value.featureSourceId) && TypesHelper.isDefined(value.featureTypeName)) {
        settings.featureType = {
          featureSourceId: value.featureSourceId,
          featureTypeName: value.featureTypeName,
        };
      } else {
        settings.featureType = undefined;
      }
    }
    if (this.isWMS) {
      const wmsSettings: LayerSettingsWmsModel = {
        ...settings,
        tilingDisabled: LayerSettingsFormComponent.getInverseBooleanOrDefault(value.tilingEnabled, undefined),
        tilingGutter: value.tilingGutter || undefined,
      };
      return wmsSettings;
    }
    if (this.isXYZ && this.isLayerSpecific) {
      const xyzSettings: LayerSettingsXyzModel = {
        ...settings,
        minZoom: value.minZoom || undefined,
        maxZoom: value.maxZoom || undefined,
        tileGridExtent: value.tileGridExtent || undefined,
        tileSize: value.tileSize || undefined,
      };
      return xyzSettings;
    }
    return settings;
  }

  private isValidForm() {
    if (!this._layerSettings) {
      return this.layerSettingsForm.dirty;
    }
    const values = this.getUpdatedLayerSettings(this.layerSettingsForm.getRawValue());
    const comparableValues: ComparableValuesArray = [
      [ values.title, this._layerSettings.title ],
      [ values.description, this._layerSettings.description ],
      [ values.attribution, this._layerSettings.attribution ],
      [ values.hiDpiDisabled, this._layerSettings.hiDpiDisabled ],
      [ values.hiDpiMode, this._layerSettings.hiDpiMode ],
      [ values.hiDpiSubstituteLayer, this._layerSettings.hiDpiSubstituteLayer ],
      [ values.authorizationRules, this._layerSettings.authorizationRules ],
    ];
    if (this.isWmsSettingsModel(values) && this.isWmsSettingsModel(this._layerSettings)) {
      comparableValues.push(
        [ values.tilingDisabled, this._layerSettings.tilingDisabled ],
        [ values.tilingGutter, this._layerSettings.tilingGutter ],
      );
    }
    if (this.isXyzSettingsModel(values) && this.isXyzSettingsModel(this._layerSettings)) {
      comparableValues.push(
        [ values.minZoom, this._layerSettings.minZoom ],
        [ values.maxZoom, this._layerSettings.maxZoom ],
        [ FormHelper.getComparableValueBounds(values.tileGridExtent), FormHelper.getComparableValueBounds(this._layerSettings.tileGridExtent) ],
        [ values.tileSize, this._layerSettings.tileSize ],
      );
    }
    return FormHelper.someValuesChanged(comparableValues);
  }

  private patchForm() {
    const hiDpiEnabled = LayerSettingsFormComponent.getInverseBooleanOrDefault(this.layerSettings?.hiDpiDisabled, this.isLayerSpecific ? null : true);
    let hiDpiMode = this.layerSettings?.hiDpiMode || null;
    if (this.isLayerSpecific && hiDpiEnabled !== false && !hiDpiMode) {
      hiDpiMode = TileLayerHiDpiModeEnum.ShowNextZoomLevel;
    }
    const patchValue: typeof this.layerSettingsForm.value = {
      title: this.layerSettings?.title ? this.layerSettings.title : '',
      description: this.layerSettings?.description || null,
      attribution: this.layerSettings?.attribution || null,
      featureSourceId: this.layerSettings?.featureType?.featureSourceId || null,
      featureTypeName: this.layerSettings?.featureType?.featureTypeName || null,
      hiDpiEnabled,
      hiDpiMode,
      hiDpiSubstituteLayer: this.layerSettings?.hiDpiSubstituteLayer || null,
      authorizationRules: this.layerSettings?.authorizationRules ?? [],
    };
    if (this.isWmsSettingsModel(this.layerSettings)) {
      patchValue.tilingEnabled = LayerSettingsFormComponent.getInverseBooleanOrDefault(this.layerSettings?.tilingDisabled, this.isLayerSpecific ? null : true);
      patchValue.tilingGutter = this.layerSettings?.tilingGutter || null;
    }
    if (this.isXyzSettingsModel(this.layerSettings)) {
      patchValue.minZoom = this.layerSettings?.minZoom || null;
      patchValue.maxZoom = this.layerSettings?.maxZoom || null;
      patchValue.tileGridExtent = this.layerSettings?.tileGridExtent || null;
      patchValue.tileSize = this.layerSettings?.tileSize || null;
    }
    this.layerSettingsForm.patchValue(patchValue, { emitEvent: false, onlySelf: true });
    this.layerSettingsForm.markAsUntouched();
    this.updateDisabledState();
  }

  private updateDisabledState() {
    if (this.layerSettingsForm.get('tilingEnabled')?.value !== false) {
      this.layerSettingsForm.get('tilingGutter')?.enable({ emitEvent: false, onlySelf: true });
    } else {
      this.layerSettingsForm.get('tilingGutter')?.disable({ emitEvent: false, onlySelf: true });
    }
    const isHiDpiEnabled = this.layerSettingsForm.get('hiDpiEnabled')?.value !== false;
    if (isHiDpiEnabled) {
      this.layerSettingsForm.get('hiDpiMode')?.enable({ emitEvent: false, onlySelf: true });
    } else {
      this.layerSettingsForm.get('hiDpiMode')?.disable({ emitEvent: false, onlySelf: true });
    }
    if (!isHiDpiEnabled || this.layerSettingsForm.get('hiDpiMode')?.value === TileLayerHiDpiModeEnum.ShowNextZoomLevel) {
      this.layerSettingsForm.get('hiDpiSubstituteLayer')?.disable({ emitEvent: false, onlySelf: true });
    } else {
      this.layerSettingsForm.get('hiDpiSubstituteLayer')?.enable({ emitEvent: false, onlySelf: true });
    }
  }

  private static getInverseBooleanOrDefault<T = null | undefined>(value: boolean | null | undefined, defaultValue: boolean | T): boolean | T {
    return typeof value === 'boolean' ? !value : defaultValue;
  }

  public updateFeatureTypeSelection($event: { featureSourceId?: number; featureTypeName?: string }) {
    if (TypesHelper.isDefined($event.featureSourceId) && TypesHelper.isDefined($event.featureTypeName)) {
      this.layerSettingsForm.patchValue({
        featureSourceId: $event.featureSourceId,
        featureTypeName: $event.featureTypeName,
      });
      return;
    }
    this.layerSettingsForm.patchValue({
      featureSourceId: null,
      featureTypeName: null,
    });
  }

  private isWmsSettingsModel(settings?: LayerSettingsModel | null): settings is LayerSettingsWmsModel {
    return !!settings && this.isWMS;
  }

  private isXyzSettingsModel(settings?: LayerSettingsModel | null): settings is LayerSettingsXyzModel {
    return !!settings && this.isXYZ;
  }

}
