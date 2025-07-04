import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AttributeDescriptorModel } from '@tailormap-admin/admin-api';
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter, map, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { nanoid } from 'nanoid';
import { InputFilterData, OutputFilterData } from '@tailormap-viewer/shared';
import { FormHelper } from '../../../../helpers/form.helper';
import { tap } from 'rxjs/operators';
import { AdminSnackbarService } from '../../../../shared/services/admin-snackbar.service';
import { ApplicationEditFilterService } from '../../application-edit-filter.service';
import {
  AttributeFilterModel, FilterToolEnum, AttributeType, FilterConditionEnum, UpdateSliderFilterModel, CheckboxFilterModel,
  UpdateSwitchFilterModel, UpdateDatePickerFilterModel, FilterTypeEnum,
} from '@tailormap-viewer/api';

@Component({
  selector: 'tm-admin-application-edit-filter-form',
  templateUrl: './application-edit-filter-form.component.html',
  styleUrls: ['./application-edit-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationEditFilterFormComponent implements OnInit {

  public filterData: InputFilterData = {
    condition: undefined,
    value: undefined,
    caseSensitive: undefined,
    invertCondition: undefined,
  };

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

  public featureTypes$ = this.applicationEditFilterService.featureTypesForSelectedLayers$;
  public loadingFeatureType$ = this.applicationEditFilterService.isLoadingFeaturesTypes$;

  public uniqueValues$: Observable<(string | number | boolean)[]> | null = null;
  public uniqueValuesStrings$: Observable<string[]> | null = null;
  private loadingUniqueValuesSubject$ = new BehaviorSubject(false);
  public loadingUniqueValues$ = this.loadingUniqueValuesSubject$.asObservable();
  private _filter: AttributeFilterModel | null | undefined;

  @Input()
  public newFilter: boolean = false;

  @Input()
  public set filter(updateFilter: AttributeFilterModel | null | undefined) {
    this._filter = updateFilter;
    this.initForm(updateFilter);
  }
  public get filter() {
    return this._filter;
  }

  @Output()
  public updateFilter = new EventEmitter<AttributeFilterModel>();

  @Output()
  public validFormChanged = new EventEmitter<boolean>();

  constructor(
    private applicationEditFilterService: ApplicationEditFilterService,
    private destroyRef: DestroyRef,
    private adminSnackbarService: AdminSnackbarService,
    private cdr: ChangeDetectorRef,
  ) { }

  public filterForm = new FormGroup({
    id: new FormControl(''),
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
        this.updateFilter.emit(attributeFilter);
      });
  }

  private initForm(attributeFilter: AttributeFilterModel | null | undefined) {
    this.filterData = {
      condition: attributeFilter?.condition,
      value: attributeFilter?.value,
      caseSensitive: attributeFilter?.caseSensitive,
      invertCondition: attributeFilter?.invertCondition,
    };
    if (!attributeFilter) {
      this.filterForm.patchValue({
        id: nanoid(),
        attribute: '',
        attributeType: null,
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
    this.cdr.detectChanges();
  }

  private isValidForm(): boolean {
    const formValues = this.filterForm.getRawValue();
    const filterValues = formValues.value;
    let validFilterValues = true;
    if (filterValues && formValues.attributeType !== AttributeType.BOOLEAN && formValues.condition !== FilterConditionEnum.NULL_KEY) {
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

  public setSelectedAttribute($event: AttributeDescriptorModel | null) {
    if (!$event) {
      this.filterForm.patchValue({
        attribute: '',
        attributeType: null,
      }, { emitEvent: true });
      return;
    }
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
    this.uniqueValues$ = this.applicationEditFilterService.getUniqueValuesForAttribute$(attributeName)
      .pipe(
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
        ? [$event.initialDate ?? '']
        : [ $event.initialLowerDate ?? '', $event.initialUpperDate ?? '' ];
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
