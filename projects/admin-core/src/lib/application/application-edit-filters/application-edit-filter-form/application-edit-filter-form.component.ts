import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AttributeFilterModel, AttributeType, CheckboxFilterModel, FilterConditionEnum, FilterGroupModel, FilterTypeEnum,
  UniqueValuesService, UpdateSliderFilterModel, FilterToolEnum,
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
import { selectApplicationSelectedFilterLayerIds, selectSelectedApplicationName } from '../../state/application.selectors';
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
  public editFilterConfiguration?: CheckboxFilterModel | UpdateSliderFilterModel;

  public filterToolOptions = [{
    label: $localize`:@@admin-core.application.filters.preset:Preset`,
    value: FilterToolEnum.PRESET_STATIC,
  }, {
    label: $localize`:@@admin-core.application.filters.checkbox:Checkbox`,
    value: FilterToolEnum.CHECKBOX,
  }, {
    label: $localize`:@@admin-core.application.filters.slider:Slider`,
    value: FilterToolEnum.SLIDER,
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
    let filterLayers = undefined;
    if (updateAttributeFilter?.filterableLayers) {
      filterLayers = updateAttributeFilter.filterableLayers.filter(layer => appLayerIds?.includes(layer.appLayerId));
      if (filterLayers) {
        this.setSelectedLayers(filterLayers);
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
    this.initForm(attributeFilter, filterLayers);
  }

  private featureTypesSubject$ = new BehaviorSubject<FeatureTypeModel[] | null>(null);
  public featureTypes$ = this.featureTypesSubject$.asObservable();

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
    layers: new FormControl<GeoServiceLayerInApplicationModel[] | null>(null),
    tool: new FormControl<FilterToolEnum>(FilterToolEnum.PRESET_STATIC),
    attribute: new FormControl(''),
    attributeType: new FormControl<AttributeType | null>(null),
    condition: new FormControl<FilterConditionEnum | null>(null),
    value: new FormControl<string[]>([]),
    caseSensitive: new FormControl(false),
    invertCondition: new FormControl(false),
    editFilterConfiguration: new FormControl<UpdateSliderFilterModel | CheckboxFilterModel | null>(null),
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
          layerIds: value.layers?.map(layer => layer.appLayerId) ?? [],
          type: FilterTypeEnum.ATTRIBUTE,
          filters: [ ...this.otherFilters, attributeFilter ],
          operator: 'AND',
        };
        this.updateFilter.emit(filterGroup);
      });
  }

  private initForm(attributeFilter?: AttributeFilterModel, layers?: GeoServiceLayerInApplicationModel[]) {
    if (!attributeFilter) {
      this.filterForm.patchValue({
        id: nanoid(),
        layers: layers ?? null,
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
      this.setUniqueValues(attributeFilter.attribute);
      this.filterForm.patchValue({
        id: attributeFilter.id,
        layers: layers ?? null,
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

  public setSelectedLayers(filterLayers: GeoServiceLayerInApplicationModel[]) {
    const featureTypeRequests = filterLayers
      .map(layer => layer.geoServiceLayer?.layerSettings?.featureType)
      .filter((featureType) => !!featureType);

    if (featureTypeRequests.length > 0) {
      this.loadingFeatureTypeSubject$.next(true);
      combineLatest(
        featureTypeRequests.map(ft =>
          this.featureSourceService.loadFeatureType$(
            ft.featureTypeName,
            `${ft.featureSourceId}`,
          ).pipe(take(1)),
        ),
      )
        .pipe(map(featureTypes => featureTypes.filter(ft => !!ft)))
        .subscribe(featureTypes => {
        this.featureTypesSubject$.next(featureTypes);
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
    this.setUniqueValues($event.name);
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
      this.store$.select(selectApplicationSelectedFilterLayerIds),
    ]).pipe(
      take(1),
      switchMap(([ applicationName, selectedLayers ]) => {
        if (!selectedLayers || selectedLayers.length === 0) {
          return [[]];
        }
        return combineLatest(
          selectedLayers.map(layerId =>
            this.uniqueValuesService.getUniqueValues$({
              attribute: attributeName,
              layerId,
              applicationId: `app/${applicationName}`,
            }).pipe(
              map(response => response.values || []),
            ),
          ),
        ).pipe(
          map((allLayerValues: (string | number | boolean)[][]) => {
            const allValues= Array.from(new Set(allLayerValues.flat()));
            if (allValues.length > ApplicationEditFilterFormComponent.MAX_CHECKBOX_VALUES
              && this.filterForm.get('tool')?.value === FilterToolEnum.CHECKBOX) {
              this.adminSnackbarService.showMessage($localize `:@@admin-core.application.filters.too-many-values:
                Too many unique values, showing only the first ${ ApplicationEditFilterFormComponent.MAX_CHECKBOX_VALUES }.`);
              return allValues.slice(0, ApplicationEditFilterFormComponent.MAX_CHECKBOX_VALUES );
            }
            return allValues;
          }),
        );
      }),
    );
    this.uniqueValuesStrings$ = this.uniqueValues$.pipe(
      map(values => values.map(value => `${value}`)),
      tap(() => this.loadingUniqueValuesSubject$.next(false)),
    );

  }

  public setEditFilterConfiguration($event: UpdateSliderFilterModel | CheckboxFilterModel) {
    let value: string[] = [];
    if ($event.filterTool === FilterToolEnum.SLIDER) {
      value = $event.initialValue?.toString()
        ? [$event.initialValue.toString()]
        : [ $event.initialLowerValue?.toString() ?? '', $event.initialUpperValue?.toString() ?? '' ];
    } else if ($event.filterTool === FilterToolEnum.CHECKBOX) {
      value = $event.attributeValuesSettings
        .filter(setting => setting.initiallySelected)
        .map(setting => setting.value);
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
    const layers = this.filterForm.get('layers')?.value;
    const attribute = this.filterForm.get('attribute')?.value;
    const tool = this.filterForm.get('tool')?.value;
    const toolLabel = this.filterToolOptions.find(option => option.value === tool)?.label;
    if (!layers) {
      return $localize`:@@admin-core.application.filters.select-layer:Select a layer to filter`;
    }
    const layerTitles = layers.map(layer => layer.geoServiceLayer?.layerSettings?.title
      || layer.geoServiceLayer?.title).join($localize `:@@admin-core.application.filters.and: and `);
    const filterInfo = layers.length > 1
      ? $localize `:@@admin-core.application.filters.multi-layer-filter-info:Multi-layer ${toolLabel} filter`
      : $localize`:@@admin-core.application.filters.filter-info:${toolLabel} filter`;
    const attributeText = attribute ? $localize`:@@admin-core.application.filters.attribute: for attribute '${attribute}'` : '';
    const layersText = layers.length > 1
      ? $localize `:@@admin-core.application.filters.on-layers: on layers `
      : $localize `:@@admin-core.application.filters.on-layer: on layer `;
    return filterInfo + attributeText + layersText + layerTitles;
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
