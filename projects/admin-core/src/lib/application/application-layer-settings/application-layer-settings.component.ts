import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AppLayerSettingsModel, AppTreeLayerNodeModel, FeatureTypeModel, FormModel, FormSummaryModel } from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { selectSelectedApplicationLayerSettings } from '../state/application.selectors';
import {
  BehaviorSubject, combineLatest, concatMap, debounceTime, distinctUntilChanged, map, Observable, of, startWith, Subject, switchMap, take,
  takeUntil,
} from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { LoadingStateEnum, TreeModel } from '@tailormap-viewer/shared';
import { ExtendedGeoServiceModel } from '../../catalog/models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../../catalog/models/extended-geo-service-layer.model';
import { ExtendedGeoServiceAndLayerModel } from '../../catalog/models/extended-geo-service-and-layer.model';
import { GeoServiceFormDialogComponent } from '../../catalog/geo-service-form-dialog/geo-service-form-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { GeoServiceLayerFormDialogComponent } from '../../catalog/geo-service-layer-form-dialog/geo-service-layer-form-dialog.component';
import { FeatureTypeFormDialogComponent } from '../../catalog/feature-type-form-dialog/feature-type-form-dialog.component';
import { ExtendedFeatureTypeModel } from '../../catalog/models/extended-feature-type.model';
import {
  selectFeatureSourceAndFeatureTypesById,
} from '../../catalog/state/catalog.selectors';
import {
  ApplicationLayerAttributeSettingsComponent,
} from '../application-layer-attribute-settings/application-layer-attribute-settings.component';
import { ExtendedFeatureSourceModel } from '../../catalog/models/extended-feature-source.model';
import { FeatureSourceService } from '../../catalog/services/feature-source.service';
import { GeoServiceService } from '../../catalog/services/geo-service.service';
import { selectFormsForFeatureType, selectFormsLoadStatus } from '../../form/state/form.selectors';
import { loadForms } from '../../form/state/form.actions';
import { FormService } from '../../form/services/form.service';

type FeatureSourceAndType = {
  featureSource: ExtendedFeatureSourceModel;
  featureType: ExtendedFeatureTypeModel | null;
};

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

  private layerSettingsSubject = new BehaviorSubject<Record<string, AppLayerSettingsModel>>({});
  private layerSettings: Record<string, AppLayerSettingsModel> = {};

  // eslint-disable-next-line max-len
  private editingDisabledTooltip = $localize `:@@admin-core.application.layer-not-editable:This layer cannot be edited because there is no writeable feature source / type configured for this layer`;

  public layerTitle = '';

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
  }
  public get serviceLayer(): ExtendedGeoServiceAndLayerModel | null {
    return this._serviceLayer;
  }

  private featureSourceAndTypeSubject$ = new BehaviorSubject<FeatureSourceAndType | null>(null);
  public featureSourceAndType$ = this.featureSourceAndTypeSubject$.asObservable();

  private selectableFormsSubject$ = new BehaviorSubject<FormSummaryModel[]>([]);
  public selectableForms$ = this.selectableFormsSubject$.asObservable();

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
  });

  public formWarningMessageData$: Observable<{ featureType: FeatureTypeModel; layerSetting: AppLayerSettingsModel; form: FormModel } | null> = of(null);

  constructor(
    private store$: Store,
    private dialog: MatDialog,
    private adminSnackbarService: AdminSnackbarService,
    private geoServiceService: GeoServiceService,
    private featureSourceService: FeatureSourceService,
    private formService: FormService,
  ) { }

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

    this.featureSourceAndType$
      .pipe(takeUntil(this.destroyed))
      .subscribe((fs) => {
        this.toggleEditableEnabled(fs?.featureType?.writeable);
      });

    this.featureSourceAndType$
      .pipe(
        takeUntil(this.destroyed),
        switchMap(fs => {
          return !fs
            ? of([])
            : this.store$.select(selectFormsForFeatureType(fs.featureSource.id, fs.featureType?.name));
        }),
      )
      .subscribe(forms => {
        this.selectableFormsSubject$.next(forms);
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
    }, { emitEvent: false });
  }

  public updateGeoServiceSetting($event: MouseEvent, geoService: ExtendedGeoServiceModel) {
    $event.preventDefault();
    this.geoServiceService.getDraftGeoService$(geoService.id)
      .pipe(
        take(1),
        concatMap(service => {
          if (!service) {
            return of(null);
          }
          return GeoServiceFormDialogComponent.open(this.dialog, {
            geoService: service,
            parentNode: geoService.catalogNodeId,
          }).afterClosed();
        }),
        takeUntil(this.destroyed),
      )
      .subscribe(updatedService => {
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
    this.featureSourceService.getDraftFeatureType$(featureSource.featureType.originalId, featureSource.featureSource.id)
      .pipe(
        take(1),
        concatMap(featureType => {
          if (!featureType) {
            return of(null);
          }
          return FeatureTypeFormDialogComponent.open(this.dialog, { featureType }).afterClosed();
        }),
        takeUntil(this.destroyed),
      )
      .subscribe(updatedFeatureType => {
        if (updatedFeatureType) {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.feature-type-settings-updated:Feature type settings updated`);
        }
      });
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
