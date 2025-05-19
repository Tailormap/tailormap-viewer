import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AttributeFilterModel, AttributeType, CheckboxFilterModel, FilterConditionEnum, FilterGroupModel, FilterTypeEnum, SliderFilterModel,
  UniqueValuesService,
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
import { FilterToolEnum } from '../../../../../../api/src/lib/models/filter-tool.enum';

@Component({
  selector: 'tm-admin-application-edit-filter-form',
  templateUrl: './application-edit-filter-form.component.html',
  styleUrls: ['./application-edit-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationEditFilterFormComponent implements OnInit {

  private filterGroupId?: string;

  public filterData: InputFilterData = {
    condition: undefined,
    value: undefined,
    caseSensitive: undefined,
    invertCondition: undefined,
  };

  public filterToolOptions = [{
    label: 'Preset',
    value: FilterToolEnum.PRESET_STATIC,
  }, {
    label: 'Checkbox',
    value: FilterToolEnum.CHECKBOX,
  }, {
    label: 'Slider',
    value: FilterToolEnum.SLIDER,
  }, {
    label: 'Boolean',
    value: FilterToolEnum.BOOLEAN,
  }];

  public uniqueValues$: Observable<string[]> | null = null;

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
    this.filterData = {
      condition: attributeFilter?.condition,
      value: attributeFilter?.value,
      caseSensitive: attributeFilter?.caseSensitive,
      invertCondition: attributeFilter?.invertCondition,
    };
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
  ) { }

  public filterForm = new FormGroup({
    id: new FormControl(''),
    layer: new FormControl<GeoServiceLayerInApplicationModel | null>(null),
    tool: new FormControl<string>("PRESET_STATIC"),
    attribute: new FormControl(''),
    attributeType: new FormControl<AttributeType | null>(null),
    condition: new FormControl<FilterConditionEnum | null>(null),
    value: new FormControl<string[]>([]),
    caseSensitive: new FormControl(false),
    invertCondition: new FormControl(false),
    editFilterConfiguration: new FormControl<SliderFilterModel | CheckboxFilterModel | null>(null),
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
        const attributeFilter: AttributeFilterModel = {
          id: value.id ?? nanoid(),
          attribute: value.attribute ?? '',
          attributeType: value.attributeType ?? AttributeType.STRING,
          condition: value.condition ?? FilterConditionEnum.NULL_KEY,
          invertCondition: value.invertCondition ?? false,
          caseSensitive: value.caseSensitive ?? false,
          value: value.value ?? [],
          type: FilterTypeEnum.ATTRIBUTE,
          editConfiguration: value.editFilterConfiguration ?? undefined,
        };
        const filterGroup: FilterGroupModel<AttributeFilterModel> = {
          id: this.filterGroupId ?? nanoid(),
          source: "PRESET",
          layerIds: [value.layer?.appLayerId ?? ''],
          type: FilterTypeEnum.ATTRIBUTE,
          filters: [attributeFilter],
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
      }, { emitEvent: false });
    } else {
      this.setUniqueValues(attributeFilter.attribute);
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
        editFilterConfiguration: attributeFilter.editConfiguration,
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
            return response.values.map(v => `${v}`) || [];
          }),
        );
      }),
    );
  }

  public setEditFilterConfiguration($event: SliderFilterModel | CheckboxFilterModel) {
    this.filterForm.patchValue({
      condition: $event.condition,
      editFilterConfiguration: $event,
    }, { emitEvent: true });
    this.filterForm.markAsDirty();
  }
}
