import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AttributeFilterModel, AttributeType, CheckboxFilterModel, FilterConditionEnum, FilterGroupModel, FilterTypeEnum,
  UniqueValuesService, UpdateSliderFilterModel, FilterToolEnum, UpdateSwitchFilterModel, UpdateDatePickerFilterModel,
} from '@tailormap-viewer/api';
import { AttributeDescriptorModel, FeatureTypeModel } from '@tailormap-admin/admin-api';
import { FormControl, FormGroup } from '@angular/forms';
import { FeatureSourceService } from '../../../catalog/services/feature-source.service';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, filter, map, Observable, switchMap, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { nanoid } from 'nanoid';
import { UpdateAttributeFilterModel } from '../../models/update-attribute-filter.model';
import { InputFilterData, OutputFilterData } from '@tailormap-viewer/shared';
import { GeoServiceLayerInApplicationModel } from '../../models/geo-service-layer-in-application.model';
import { FormHelper } from '../../../helpers/form.helper';
import { selectApplicationSelectedFilterLayerId, selectSelectedApplicationName } from '../../state/application.selectors';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { AdminSnackbarService } from '../../../shared/services/admin-snackbar.service';

@Component({
  selector: 'tm-admin-application-edit-filter-form',
  templateUrl: './application-edit-filter-form.component.html',
  styleUrls: ['./application-edit-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationEditFilterFormComponent implements OnInit {

  private filterGroupId?: string;
  private otherFilters: AttributeFilterModel[] = [];

  public filterData: InputFilterData = {
    condition: undefined,
    value: undefined,
    caseSensitive: undefined,
    invertCondition: undefined,
  };
  public editFilterConfiguration?: CheckboxFilterModel | UpdateSliderFilterModel | UpdateSwitchFilterModel | UpdateDatePickerFilterModel;

  public filterToolOptions = [{
    label: $localize`:@@admin-core.application.filters.preset:Preset`,
    value: FilterToolEnum.PRESET_STATIC,
  }, {
    label: $localize`:@@admin-core.application.filters.checkbox:Checkbox`,
    value: FilterToolEnum.CHECKBOX,
  }, {
    label: $localize`:@@admin-core.application.filters.numeric:Numeric`,
    value: FilterToolEnum.SLIDER,
  }, {
    label: $localize`:@@admin-core.application.filters.switch:Switch`,
    value: FilterToolEnum.SWITCH,
  }, {
    label: $localize`:@@admin-core.application.filters.date-picker:Date Picker`,
    value: FilterToolEnum.DATE_PICKER,
  }];

  private static readonly MAX_CHECKBOX_VALUES = 50;

  public uniqueValues$: Observable<(string | number | boolean)[]> | null = null;
  public uniqueValuesStrings$: Observable<string[]> | null = null;
  private loadingUniqueValuesSubject$ = new BehaviorSubject(false);
  public loadingUniqueValues$ = this.loadingUniqueValuesSubject$.asObservable();

  @Input()
  public newFilter: boolean = false;

  @Input()
  public set filter(updateAttributeFilter: UpdateAttributeFilterModel | null) {
    this.filterGroupId = updateAttributeFilter?.filterGroup.id;
    const appLayerIds = updateAttributeFilter?.filterGroup.layerIds;
    let filterLayer = undefined;
    if (updateAttributeFilter?.filterableLayers) {
      filterLayer = updateAttributeFilter.filterableLayers.find(layer => layer.appLayerId === appLayerIds?.[0]);
      if (filterLayer) {
        this.setSelectedLayer(filterLayer);
      }
    }
    const attributeFilter = updateAttributeFilter?.filterGroup.filters.find(filterInGroup =>
      filterInGroup.id === updateAttributeFilter?.filterId);
    this.otherFilters = updateAttributeFilter?.filterGroup.filters.filter(filterInGroup => filterInGroup.id !== updateAttributeFilter?.filterId) ?? [];
    this.filterData = {
      condition: attributeFilter?.condition,
      value: attributeFilter?.value,
      caseSensitive: attributeFilter?.caseSensitive,
      invertCondition: attributeFilter?.invertCondition,
    };
    this.editFilterConfiguration = attributeFilter?.editConfiguration;
    this.initForm(attributeFilter, filterLayer);
  }

  private featureTypeSubject$ = new BehaviorSubject<FeatureTypeModel | null>(null);
  public featureType$ = this.featureTypeSubject$.asObservable();

  private loadingFeatureTypeSubject$ = new BehaviorSubject(false);
  public loadingFeatureType$ = this.loadingFeatureTypeSubject$.asObservable();

  @Output()
  public updateFilter = new EventEmitter<FilterGroupModel<AttributeFilterModel>>();

  @Output()
  public validFormChanged = new EventEmitter<boolean>();

  constructor(
    private featureSourceService: FeatureSourceService,
    private destroyRef: DestroyRef,
    private store$: Store,
    private uniqueValuesService: UniqueValuesService,
    private adminSnackbarService: AdminSnackbarService,
  ) { }

  public filterForm = new FormGroup({
    id: new FormControl(''),
    layer: new FormControl<GeoServiceLayerInApplicationModel | null>(null),
    tool: new FormControl<FilterToolEnum>(FilterToolEnum.PRESET_STATIC),
    attribute: new FormControl(''),
    attributeType: new FormControl<AttributeType | null>(null),
    condition: new FormControl<FilterConditionEnum | null>(null),
    value: new FormControl<string[]>([]),
    caseSensitive: new FormControl(false),
    invertCondition: new FormControl(false),
    editFilterConfiguration: new FormControl<UpdateSliderFilterModel | CheckboxFilterModel | UpdateSwitchFilterModel | UpdateDatePickerFilterModel | null>(null),
  });

  public ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        map(() => this.isValidForm()),
        distinctUntilChanged(),
      )
      .subscribe(value => {
        this.validFormChanged.emit(value);
      });
    this.filterForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        filter(() => this.isValidForm()),
      )
      .subscribe(value => {
        const editFilterConfiguration = value.editFilterConfiguration
          ? { ...value.editFilterConfiguration, condition: undefined } : undefined;
        const attributeFilter: AttributeFilterModel = {
          id: value.id ?? nanoid(),
          attribute: value.attribute ?? '',
          attributeType: value.attributeType ?? AttributeType.STRING,
          condition: value.condition ?? FilterConditionEnum.NULL_KEY,
          invertCondition: value.invertCondition ?? false,
          caseSensitive: value.caseSensitive ?? false,
          value: value.value ?? [],
          type: FilterTypeEnum.ATTRIBUTE,
          editConfiguration: editFilterConfiguration ?? undefined,
        };
        const filterGroup: FilterGroupModel<AttributeFilterModel> = {
          id: this.filterGroupId ?? nanoid(),
          source: "PRESET",
          layerIds: [value.layer?.appLayerId ?? ''],
          type: FilterTypeEnum.ATTRIBUTE,
          filters: [ ...this.otherFilters, attributeFilter ],
          operator: 'AND',
        };
        this.updateFilter.emit(filterGroup);
      });
  }

  private initForm(attributeFilter?: AttributeFilterModel, layer?: GeoServiceLayerInApplicationModel) {
    if (!attributeFilter) {
      this.filterForm.patchValue({
        id: nanoid(),
        layer: layer ?? null,
        attribute: '',
        condition: null,
        value: [],
        caseSensitive: false,
        invertCondition: false,
        editFilterConfiguration: null,
      }, { emitEvent: false });
    } else {
      const editFilterConfiguration = attributeFilter.editConfiguration
        ? { ...attributeFilter.editConfiguration, condition: attributeFilter.condition } : undefined;
      if (attributeFilter.attributeType !== AttributeType.BOOLEAN) {
        this.setUniqueValues(attributeFilter.attribute);
      }
      this.filterForm.patchValue({
        id: attributeFilter.id,
        layer: layer ?? null,
        tool: attributeFilter.editConfiguration?.filterTool ?? FilterToolEnum.PRESET_STATIC,
        attribute: attributeFilter.attribute,
        attributeType: attributeFilter.attributeType,
        condition: attributeFilter.condition,
        value: attributeFilter.value,
        caseSensitive: attributeFilter.caseSensitive,
        invertCondition: attributeFilter.invertCondition,
        editFilterConfiguration: editFilterConfiguration,
      }, { emitEvent: false });
    }
  }

  private isValidForm(): boolean {
    const formValues = this.filterForm.getRawValue();
    const filterValues = formValues.value;
    let validFilterValues = true;
    if (filterValues && formValues.attributeType !== AttributeType.BOOLEAN) {
      for (const filterValue of filterValues) {
        if (!FormHelper.isValidValue(filterValue)) {
          validFilterValues = false;
        }
      }
    }
    return FormHelper.isValidValue(formValues.id)
      && FormHelper.isValidValue(formValues.attribute)
      && formValues.attributeType !== null
      && formValues.condition !== null
      && validFilterValues
      && this.filterForm.dirty;
  }

  public setSelectedLayer($event: GeoServiceLayerInApplicationModel) {
    this.loadingFeatureTypeSubject$.next(true);
    if ($event.geoServiceLayer?.layerSettings?.featureType) {
      this.featureSourceService.loadFeatureType$(
        $event.geoServiceLayer?.layerSettings?.featureType?.featureTypeName,
        `${$event.geoServiceLayer?.layerSettings?.featureType?.featureSourceId}`,
      )
        .pipe(take(1))
        .subscribe(featureType => {
          this.featureTypeSubject$.next(featureType);
          this.loadingFeatureTypeSubject$.next(false);
        });
    }

  }

  public setSelectedAttribute($event: AttributeDescriptorModel) {
    this.filterForm.patchValue({
      attribute: $event.name,
      attributeType: $event.type,
    }, { emitEvent: true });
    this.filterForm.markAsDirty();
    if ($event.type !== AttributeType.BOOLEAN) {
      this.setUniqueValues($event.name);
    }
  }

  public setFilterValues($event: OutputFilterData) {
    this.filterForm.patchValue({
      condition: $event.condition,
      value: $event.value,
      caseSensitive: $event.caseSensitive,
      invertCondition: $event.invertCondition,
    }, { emitEvent: true });
    this.filterForm.markAsDirty();
  }

  public setUniqueValues(attributeName: string) {
    this.loadingUniqueValuesSubject$.next(true);
    this.uniqueValues$ = combineLatest([
      this.store$.select(selectSelectedApplicationName),
      this.store$.select(selectApplicationSelectedFilterLayerId),
    ]).pipe(
      take(1),
      switchMap(([ applicationName, selectedLayer ]) => {
        return this.uniqueValuesService.getUniqueValues$({
          attribute: attributeName,
          layerId: selectedLayer ?? '',
          applicationId: `app/${applicationName}`,
        }).pipe(
          map(response => {
            if (response.values.length > ApplicationEditFilterFormComponent.MAX_CHECKBOX_VALUES
              && this.filterForm.get('tool')?.value === FilterToolEnum.CHECKBOX) {
              this.adminSnackbarService.showMessage($localize `:@@admin-core.application.filters.too-many-values:
              Too many unique values, showing only the first ${ ApplicationEditFilterFormComponent.MAX_CHECKBOX_VALUES }.`);
              return response.values.slice(0, ApplicationEditFilterFormComponent.MAX_CHECKBOX_VALUES );
            }
            return response.values || [];
          }),
        );
      }),
    );
    this.uniqueValuesStrings$ = this.uniqueValues$.pipe(
      map(values => values.map(value => `${value}`)),
      tap(() => this.loadingUniqueValuesSubject$.next(false)),
    );

  }

  public setEditFilterConfiguration(
    $event: UpdateSliderFilterModel | CheckboxFilterModel | UpdateSwitchFilterModel | UpdateDatePickerFilterModel,
  ) {
    let value: string[] = [];
    if ($event.filterTool === FilterToolEnum.SLIDER) {
      value = $event.initialValue?.toString()
        ? [$event.initialValue.toString()]
        : [ $event.initialLowerValue?.toString() ?? '', $event.initialUpperValue?.toString() ?? '' ];
    } else if ($event.filterTool === FilterToolEnum.CHECKBOX) {
      value = $event.attributeValuesSettings
        .filter(setting => setting.initiallySelected)
        .map(setting => setting.value);
    } else if ($event.filterTool === FilterToolEnum.SWITCH && $event.value1 !== undefined && $event.value2 !== undefined) {
      value = $event.startWithValue2 ? [$event.value2] : [$event.value1];
    } else if ($event.filterTool === FilterToolEnum.DATE_PICKER) {
      value = $event.initialDate
        ? [$event.initialDate.toISODate() ?? '']
        : [ $event.initialLowerDate?.toISODate() ?? '', $event.initialUpperDate?.toISODate() ?? '' ];
    }
    const condition = $event.filterTool === FilterToolEnum.CHECKBOX
      ? FilterConditionEnum.UNIQUE_VALUES_KEY
      : $event.condition;
    this.filterForm.patchValue({
      condition: condition,
      value: value,
      editFilterConfiguration: $event,
    }, { emitEvent: true });
    this.filterForm.markAsDirty();
  }

  public getAttributeFilterInfo(): string {
    const layer = this.filterForm.get('layer')?.value;
    const attribute = this.filterForm.get('attribute')?.value;
    const tool = this.filterForm.get('tool')?.value;
    const toolLabel = this.filterToolOptions.find(option => option.value === tool)?.label;
    if (!layer) {
      return $localize`:@@admin-core.application.filters.select-layer:Select a layer to filter`;
    } else if (!attribute) {
      const layerTitle = layer.geoServiceLayer?.layerSettings?.title || layer.geoServiceLayer?.title;
      return `${toolLabel} ` + $localize`:@@admin-core.application.filters.filter-on-layer:filter on layer '${layerTitle}'`;
    } else {
      const layerTitle = layer.geoServiceLayer?.layerSettings?.title || layer.geoServiceLayer?.title;
      return `${toolLabel} ` + $localize`:@@admin-core.application.filters.filter-on-attribute-layer:filter for attribute '${attribute}' on layer '${layerTitle}'`;
    }
  }

  public resetFormOnToolChange() {
    this.filterForm.patchValue({
      attribute: '',
      attributeType: null,
      condition: null,
      value: [],
      caseSensitive: false,
      invertCondition: false,
      editFilterConfiguration: null,
    }, { emitEvent: false });
  }

}
