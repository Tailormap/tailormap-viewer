import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, combineLatest, debounceTime, map, Observable, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import {
  AuthorizationGroups, AuthorizationRuleGroup, GeoServiceProtocolEnum, GroupModel, LayerSettingsModel, LayerSettingsWmsModel,
  LayerSettingsXyzModel,
} from '@tailormap-admin/admin-api';
import { ComparableValuesArray, FormHelper } from '../../helpers/form.helper';
import { TypesHelper } from '@tailormap-viewer/shared';
import { GroupService } from '../../user/services/group.service';
import { Store } from '@ngrx/store';
import { selectGeoServiceById, selectGeoServiceLayersByGeoServiceId } from '../state/catalog.selectors';
import { BoundsModel, TileLayerHiDpiModeEnum } from '@tailormap-viewer/api';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { ProjectionAvailability } from '../../application/helpers/admin-projections-helper';

@Component({
  selector: 'tm-admin-layer-settings-form',
  templateUrl: './layer-settings-form.component.html',
  styleUrls: ['./layer-settings-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LayerSettingsFormComponent implements OnInit {
  private store$ = inject(Store);


  private destroyed = new Subject();
  private _layerSettings: LayerSettingsModel | null | undefined;
  private _isLayerSpecific = false;
  private _serviceId: string | undefined = undefined;
  private _protocol: GeoServiceProtocolEnum | undefined;
  private _layerName: string | null | undefined;

  @Input()
  public set protocol(protocol: GeoServiceProtocolEnum) {
    this.isWMS = protocol === GeoServiceProtocolEnum.WMS;
    this.isWMTS = protocol === GeoServiceProtocolEnum.WMTS;
    this.isXYZ = protocol === GeoServiceProtocolEnum.XYZ;
    this.isTILES3D = protocol === GeoServiceProtocolEnum.TILES3D;
    this.isQUANTIZEDMESH = protocol === GeoServiceProtocolEnum.QUANTIZEDMESH;
    this._protocol = protocol;
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
    this.serviceId$.next(serviceId);

    if (serviceId === undefined) {
      this.geoServiceAuthorizations$ = of([]);
      this.layers$ = of([]);
      this.xyzProjection$ = of('');
    } else {
      this.geoServiceAuthorizations$ = this.store$.select(selectGeoServiceById(serviceId)).pipe(
        takeUntil(this.destroyed),
        map((settings) => settings?.authorizationRules ?? []),
      );
      this.isServiceAuthorisationLoggedIn$ = this.geoServiceAuthorizations$.pipe(map((rules) => !!rules?.find(rule => rule.groupName === AuthorizationGroups.AUTHENTICATED)));
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

  public get layerName() {
    return this._layerName;
  }

  @Input()
  public set layerName(layerName: string | null | undefined) {
    this._layerName = layerName;
    this.layerName$.next(layerName);
  }

  private readonly serviceId$ = new BehaviorSubject<string | undefined>(undefined);
  private readonly layerName$ = new BehaviorSubject<string | null | undefined>(undefined);

  public serviceLayer$: Observable<ExtendedGeoServiceLayerModel | undefined> = combineLatest([
    this.serviceId$,
    this.layerName$,
  ]).pipe(
    switchMap(([ serviceId, layerName ]) => {
      if (!serviceId) {
        return of(undefined);
      }
      return this.store$.select(selectGeoServiceLayersByGeoServiceId(serviceId)).pipe(
        map(layers => layers.find(layer => layer.name === layerName)),
      );
    }),
  );

  public layerKeywords$ = this.serviceLayer$.pipe(
    map(layer => layer?.keywords ?? []),
  );

  public getKeywords(layerKeywords: string[] | null) {
    const hiddenKeywords = this.layerSettingsForm.get('hiddenKeywords')?.value ?? [];
    const extraKeywords = this.layerSettingsForm.get('extraKeywords')?.value ?? [];
    const keywords = (layerKeywords || []).filter(keyword => !hiddenKeywords.includes(keyword));
    return keywords.concat(extraKeywords);

  }

  @Input()
  public projectionAvailability$: Observable<ProjectionAvailability[] | null> = of(null);

  @Output()
  public changed = new EventEmitter<LayerSettingsModel | null>();

  public groups$: Observable<GroupModel[]>;
  public geoServiceAuthorizations$: Observable<AuthorizationRuleGroup[]> = of([]);
  public layers$: Observable<ExtendedGeoServiceLayerModel[]> = of([]);
  public xyzProjection$: Observable<string> = of('');
  public isWMS = false;
  public isWMTS = false;
  public isXYZ = false;
  public isTILES3D = false;
  public isQUANTIZEDMESH = false;
  public hiDpiModes = TileLayerHiDpiModeEnum;
  public isServiceAuthorisationLoggedIn$ = of(false);

  public layerSettingsForm = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    description: new FormControl<string | null>(null),
    attribution: new FormControl<string | null>(null),
    hiddenKeywords: new FormControl<string[] | null>(null),
    extraKeywords: new FormControl<string[] | null>(null),
    legendImageId: new FormControl<string | null>(null),
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

  constructor() {
    const groupDetailsService = inject(GroupService);
    this.groups$ = groupDetailsService.getGroups$();
  }

  public ngOnInit(): void {
    this.patchForm();
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
      legendImageId: value.legendImageId || undefined,
      description: value.description || undefined,
      hiddenKeywords: value.hiddenKeywords || [],
      extraKeywords: value.extraKeywords || [],
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
      [ values.legendImageId, this._layerSettings.legendImageId ],
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
    if (!this._protocol) {
      return;
    }
    const hiDpiEnabled = LayerSettingsFormComponent.getInverseBooleanOrDefault(this.layerSettings?.hiDpiDisabled, this.isLayerSpecific ? null : false);
    let hiDpiMode = this.layerSettings?.hiDpiMode || null;
    if (this.isLayerSpecific && hiDpiEnabled !== false && !hiDpiMode) {
      hiDpiMode = TileLayerHiDpiModeEnum.ShowNextZoomLevel;
    }
    const patchValue: typeof this.layerSettingsForm.value = {
      title: this.layerSettings?.title ? this.layerSettings.title : '',
      description: this.layerSettings?.description || null,
      attribution: this.layerSettings?.attribution || null,
      hiddenKeywords: this.layerSettings?.hiddenKeywords || [],
      extraKeywords: this.layerSettings?.extraKeywords || [],
      legendImageId: this.layerSettings?.legendImageId || null,
      featureSourceId: this.layerSettings?.featureType?.featureSourceId || null,
      featureTypeName: this.layerSettings?.featureType?.featureTypeName || null,
      hiDpiEnabled,
      hiDpiMode,
      hiDpiSubstituteLayer: this.layerSettings?.hiDpiSubstituteLayer || null,
      authorizationRules: this.layerSettings?.authorizationRules ?? [],
    };
    if (this.isWmsSettingsModel(this.layerSettings)) {
      patchValue.tilingEnabled = LayerSettingsFormComponent.getInverseBooleanOrDefault(this.layerSettings?.tilingDisabled, this.isLayerSpecific ? null : false);
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
    const isHiDpiEnabled = this.layerSettingsForm.get('hiDpiEnabled')?.value === true;
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
    if (TypesHelper.isDefined($event.featureSourceId)) {
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

  public isKeywordHidden(keyword: string) {
    return this.layerSettingsForm.get('hiddenKeywords')?.value?.includes(keyword) ?? false;
  }

public layerKeywordClick(keyword: string): void {
  const current = this.layerSettingsForm.get('hiddenKeywords')?.value ?? [];
  const newHiddenKeywords = current.includes(keyword)
    ? current.filter(k => k !== keyword)
    : [ ...current, keyword ];
  this.layerSettingsForm.patchValue({
    hiddenKeywords: newHiddenKeywords,
  });
}

public addExtraKeyword(keyword: string): void {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return;
  }
  const current = this.layerSettingsForm.get('extraKeywords')?.value ?? [];
  if (current.includes(trimmed)) {
    return;
  }
  this.layerSettingsForm.patchValue({
    extraKeywords: [ ...current, trimmed ],
  });
}

  public removeExtraKeyword(keyword: string) {
    this.layerSettingsForm.patchValue({
      extraKeywords: (this.layerSettingsForm.get('extraKeywords')?.value ?? []).filter(k => k !== keyword),
    });
  }
}
