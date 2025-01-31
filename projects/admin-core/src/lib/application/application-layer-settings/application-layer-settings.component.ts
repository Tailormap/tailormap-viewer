import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import {
  AppLayerSettingsModel, AppTreeLayerNodeModel, FeatureTypeModel, FormModel, FormSummaryModel, GeoServiceProtocolEnum, SearchIndexModel,
} from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { selectSelectedApplicationLayerSettings } from '../state/application.selectors';
import {
  BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, map, Observable, of, startWith, Subject, switchMap, take,
  takeUntil,
} from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { LoadingStateEnum, TreeModel } from '@tailormap-viewer/shared';
import { ExtendedGeoServiceAndLayerModel } from '../../catalog/models/extended-geo-service-and-layer.model';
import { MatDialog } from '@angular/material/dialog';
import { ExtendedFeatureTypeModel } from '../../catalog/models/extended-feature-type.model';
import { selectFeatureSourceAndFeatureTypesById } from '../../catalog/state/catalog.selectors';
import {
  ApplicationLayerAttributeSettingsComponent,
} from '../application-layer-attribute-settings/application-layer-attribute-settings.component';
import { ExtendedFeatureSourceModel } from '../../catalog/models/extended-feature-source.model';
import { FeatureSourceService } from '../../catalog/services/feature-source.service';
import { selectFormsForFeatureType, selectFormsLoadStatus } from '../../form/state/form.selectors';
import { loadForms } from '../../form/state/form.actions';
import { FormService } from '../../form/services/form.service';
import { selectSearchIndexesForFeatureType, selectSearchIndexesLoadStatus } from '../../search-index/state/search-index.selectors';
import { loadSearchIndexes } from '../../search-index/state/search-index.actions';
import { ApplicationFeature, ApplicationFeatureSwitchService } from '@tailormap-viewer/api';

type FeatureSourceAndType = {
  featureSource: ExtendedFeatureSourceModel;
  featureType: ExtendedFeatureTypeModel | null;
};

@Component({
  selector: 'tm-admin-application-layer-settings',
  templateUrl: './application-layer-settings.component.html',
  styleUrls: ['./application-layer-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationLayerSettingsComponent implements OnInit, OnDestroy {

  private _node: TreeModel<AppTreeLayerNodeModel> | null = null;
  private _serviceLayer: ExtendedGeoServiceAndLayerModel | null = null;

  private destroyed = new Subject();

  private layerSettingsSubject = new BehaviorSubject<Record<string, AppLayerSettingsModel>>({});
  private layerSettings: Record<string, AppLayerSettingsModel> = {};

  // eslint-disable-next-line max-len
  private editingDisabledTooltip = $localize `:@@admin-core.application.layer-not-editable:This layer cannot be edited because there is no writeable feature source / type configured for this layer`;

  public layerTitle = '';
  public searchIndexEnabled$: Observable<boolean>;

  public layerIs3D = false;

  @Input()
  public set node(node: TreeModel<AppTreeLayerNodeModel> | null) {
    this._node = node;
    this.initForm(this._node);
    this.setTitle();
  }
  public get node(): TreeModel<AppTreeLayerNodeModel> | null {
    return this._node;
  }

  @Input()
  public set serviceLayer(serviceLayer: ExtendedGeoServiceAndLayerModel | null) {
    this._serviceLayer = serviceLayer;
    this.initFeatureSource(serviceLayer);
    this.setTitle();
    this.layerIs3D = serviceLayer?.service.protocol === GeoServiceProtocolEnum.TILES3D ||
      serviceLayer?.service.protocol === GeoServiceProtocolEnum.QUANTIZEDMESH;
  }
  public get serviceLayer(): ExtendedGeoServiceAndLayerModel | null {
    return this._serviceLayer;
  }

  private featureSourceAndTypeSubject$ = new BehaviorSubject<FeatureSourceAndType | null>(null);
  public featureSourceAndType$ = this.featureSourceAndTypeSubject$.asObservable();

  private selectableFormsSubject$ = new BehaviorSubject<FormSummaryModel[]>([]);
  public selectableForms$ = this.selectableFormsSubject$.asObservable();

  private selectableSearchIndexesSubject$ = new BehaviorSubject<SearchIndexModel[]>([]);
  public selectableSearchIndexes$ = this.selectableSearchIndexesSubject$.asObservable();

  public editableTooltipSubject$ = new BehaviorSubject(this.editingDisabledTooltip);
  public editableTooltip$ = this.editableTooltipSubject$.asObservable();

  @Output()
  public layerSettingsChange = new EventEmitter<{ nodeId: string; settings: AppLayerSettingsModel | null }>();

  public layerSettingsForm = new FormGroup({
    title: new FormControl<string | null>(null),
    opacity: new FormControl<number>(100, { nonNullable: true }),
    attribution: new FormControl<string | null>(null),
    description: new FormControl<string | null>(null),
    editable: new FormControl<boolean>(false),
    formId: new FormControl<number | null>(null),
    searchIndexId: new FormControl<number | null>(null),
    autoRefreshInSeconds: new FormControl<number | null>(null),
  });

  public formWarningMessageData$: Observable<{ featureType: FeatureTypeModel; layerSetting: AppLayerSettingsModel; form: FormModel } | null> = of(null);

  constructor(
    private store$: Store,
    private dialog: MatDialog,
    private featureSourceService: FeatureSourceService,
    private formService: FormService,
    private applicationFeatureSwitchService: ApplicationFeatureSwitchService,
  ) {
    this.searchIndexEnabled$ = this.applicationFeatureSwitchService.isFeatureEnabled$(ApplicationFeature.SEARCH_INDEX);
  }

  public ngOnInit(): void {
    this.store$.select(selectSelectedApplicationLayerSettings)
      .pipe(takeUntil(this.destroyed))
      .subscribe(layerSettings => {
        this.layerSettings = layerSettings;
        this.layerSettingsSubject.next(layerSettings);
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
          formId: value.formId ?? null,
          searchIndexId: value.searchIndexId ?? null,
          autoRefreshInSeconds: value.autoRefreshInSeconds ?? null,
        };
        this.layerSettingsChange.emit({ nodeId: this.node.id, settings });
      });

    this.store$.select(selectFormsLoadStatus)
      .pipe(take(1))
      .subscribe(loadStatus => {
        if (loadStatus === LoadingStateEnum.INITIAL || loadStatus === LoadingStateEnum.FAILED) {
          this.store$.dispatch(loadForms());
        }
      });

    this.searchIndexEnabled$
      .pipe(
        switchMap(enabled => enabled ? this.store$.select(selectSearchIndexesLoadStatus) : of(null)),
        take(1),
      )
      .subscribe(loadStatus => {
        if (loadStatus === LoadingStateEnum.INITIAL || loadStatus === LoadingStateEnum.FAILED) {
          this.store$.dispatch(loadSearchIndexes());
        }
      });

    this.featureSourceAndType$
      .pipe(takeUntil(this.destroyed))
      .subscribe((fs) => {
        this.toggleEditableEnabled(fs?.featureType?.writeable);
      });

    this.featureSourceAndType$
      .pipe(
        takeUntil(this.destroyed),
        switchMap(fs => {
          if (!fs || !fs.featureType) {
            return of([ null, null ]);
          }
          const featureTypeId = fs.featureType.originalId;
          return combineLatest([
              this.store$.select(selectFormsForFeatureType(fs.featureSource.id, fs.featureType.name)),
              this.searchIndexEnabled$
                .pipe(switchMap(enabled => enabled
                  ? this.store$.select(selectSearchIndexesForFeatureType(featureTypeId))
                  : of(null)),
                ),
            ]);
        }),
      )
      .subscribe(([ forms, searchIndexes ]) => {
        if (forms) {
          this.selectableFormsSubject$.next(forms);
        }
        if (searchIndexes) {
          this.selectableSearchIndexesSubject$.next(searchIndexes);
        }
      });

    const formIdControl = this.layerSettingsForm.get('formId');
    if (formIdControl) {
      const selectedForm$ = formIdControl.valueChanges.pipe(
        startWith(''),
        distinctUntilChanged(),
        switchMap(formId => {
          const id = formId || this.layerSettings[this.node?.id || '']?.formId;
          if (!id) {
            return of(null);
          }
          return this.formService.getForm$(+id);
        }),
      );
      this.formWarningMessageData$ = combineLatest([
        selectedForm$,
        this.layerSettingsSubject.asObservable(),
        this.featureSourceAndType$,
      ])
        .pipe(
          switchMap(([ form, layerSettings, featureSourceType ]) => {
            const layerSetting = layerSettings[this.node?.id || ''];
            if (!form || !layerSetting || !featureSourceType?.featureType) {
              return of(null);
            }
            return this.featureSourceService.loadFeatureType$(featureSourceType.featureType.name, featureSourceType.featureSource.id)
              .pipe(
                map((featureType) => {
                  if (!featureType) {
                    return null;
                  }
                  return {
                    featureType,
                    layerSetting,
                    form,
                  };
                }),
              );
          }),
        );
    }
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
      formId: nodeSettings.formId || null,
      searchIndexId: nodeSettings.searchIndexId || null,
      autoRefreshInSeconds: nodeSettings.autoRefreshInSeconds || null,
    }, { emitEvent: false });
  }

  private initFeatureSource(serviceLayer: ExtendedGeoServiceAndLayerModel | null) {
    if (!serviceLayer || typeof serviceLayer.layerSettings?.featureType?.featureSourceId === "undefined") {
      this.featureSourceAndTypeSubject$.next(null);
      return;
    }
    const featureSourceId = `${serviceLayer.layerSettings?.featureType?.featureSourceId}`;
    this.store$.select(selectFeatureSourceAndFeatureTypesById(featureSourceId))
      .pipe(
        take(1),
        map(featureSource => {
          if (!featureSource) {
            return null;
          }
          return {
            featureSource,
            featureType: featureSource.featureTypes.find(ft => ft.name === serviceLayer.layerSettings?.featureType?.featureTypeName) || null,
          };
        }),
      )
      .subscribe(fs => {
        this.featureSourceAndTypeSubject$.next(fs);
      });
  }

  private toggleEditableEnabled(enabled?: boolean) {
    this.editableTooltipSubject$.next(enabled ? ' ' : this.editingDisabledTooltip);
    if (enabled) {
      this.layerSettingsForm.get('editable')?.enable({ emitEvent: false });
      this.layerSettingsForm.get('formId')?.enable({ emitEvent: false });
    } else {
      this.layerSettingsForm.get('editable')?.disable({ emitEvent: false });
      this.layerSettingsForm.get('formId')?.disable({ emitEvent: false });
    }
  }

  public editAppLayerAttribute($event: MouseEvent, featureSourceAndType: FeatureSourceAndType | null) {
    $event.preventDefault();
    const nodeId = this.node?.id;
    if (!nodeId || !featureSourceAndType?.featureType?.hasAttributes) {
      return;
    }
    this.featureSourceService.loadFeatureType$(featureSourceAndType.featureType.name, featureSourceAndType.featureSource.id)
      .pipe(
        take(1),
        switchMap(featureType => {
          if (!featureType) {
            return of(null);
          }
          return ApplicationLayerAttributeSettingsComponent.open(this.dialog, {
            attributes: featureType.attributes,
            appLayerSettings: this.layerSettings[nodeId] || {},
            featureTypeSettings: featureType.settings,
          }).afterClosed();
        }),
        takeUntil(this.destroyed),
      )
      .subscribe(result => {
        if (!result) {
          return;
        }
        this.layerSettingsChange.emit({
          nodeId,
          settings: { ...this.layerSettings[nodeId], ...result },
        });
      });
  }

  private setTitle() {
    if (this.serviceLayer) {
      this.layerTitle =  this.serviceLayer.layer.layerSettings?.title ||  this.serviceLayer.layer.title;
    } else if (this.node) {
      this.layerTitle = this.node.label;
    } else {
      this.layerTitle = '';
    }
  }

}
