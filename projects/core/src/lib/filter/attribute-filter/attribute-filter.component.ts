import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { debounceTime, take, takeUntil, tap } from 'rxjs/operators';
import { DateTime } from 'luxon';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';
import { FilterConditionEnum } from '../models/filter-condition.enum';
import { FilterConditionModel } from '../models/filter-condition.model';
import { AttributeFilterHelper } from '../helpers/attribute-filter.helper';

interface InputFilterData {
  condition?: FilterConditionEnum;
  value?: Array<string | DateTime>;
  caseSensitive?: boolean;
  invertCondition?: boolean;
}

interface FilterData {
  condition?: FilterConditionEnum | string;
  value?: string[];
  caseSensitive?: boolean;
  invertCondition?: boolean;
}

interface OutputFilterData {
  condition: FilterConditionEnum;
  value: string[];
  caseSensitive?: boolean;
  invertCondition?: boolean;
}

@Component({
  selector: 'tm-attribute-filter',
  templateUrl: './attribute-filter.component.html',
  styleUrls: ['./attribute-filter.component.css'],
})
export class AttributeFilterComponent implements OnInit, OnDestroy {

  @Input()
  public set attributeType(attributeType: FeatureAttributeTypeEnum) {
    this._attributeType = attributeType;
    this.setDisabledState();
    this.updateConditions();
  }

  @Input()
  public set filter(filter: InputFilterData) {
    let value: string | DateTime = '';
    let value2: string | DateTime = '';
    if (filter.value && filter.value.length === 1 && this.isDateLikeAttributeType()) {
      value = this.toDateTime(filter.value[0]);
    } else if (filter.value && filter.value.length === 2 && this.isDateLikeAttributeType()) {
      value = this.toDateTime(filter.value[0]);
      value2 = this.toDateTime(filter.value[1]);
    } else if (filter.value && filter.value.length === 1) {
      value = filter.value[0];
    }
    const caseSensitive = this.toBoolean(filter.caseSensitive, false);
    const invertCondition = this.toBoolean(filter.invertCondition, false);
    this.attributeFilterForm.patchValue({
      condition: filter.condition || '',
      value,
      value2,
      caseSensitive,
      invertCondition,
    }, { emitEvent: false });
    if (this.formValues && this.formValues.condition !== filter.condition && filter.condition === FilterConditionEnum.UNIQUE_VALUES_KEY) {
      this.initUniqueValues();
    }
    this.formValues = {
      condition: filter.condition,
      value: filter.value ? filter.value.map(val => this.mapValueToString(val)) : [],
      caseSensitive,
      invertCondition,
    };
  }

  @Input()
  public set uniqueValues$(uniqueValues$: Observable<string[]> | null) {
    if (!uniqueValues$) {
      return;
    }
    this.uniqueValuesLoader$ = uniqueValues$;
    this.hasUniqueValues = !!uniqueValues$;
    this.updateConditions();
    if (this.formValues && this.formValues.condition === FilterConditionEnum.UNIQUE_VALUES_KEY) {
      this.uniqueValuesLoaded = false;
      this.initUniqueValues();
    }
  }

  @Output()
  public filterChanged: EventEmitter<OutputFilterData> = new EventEmitter<OutputFilterData>();

  private hasUniqueValues = false;
  private uniqueValuesLoader$: Observable<string[]> = of([]);
  public loadingUniqueValues = false;
  private uniqueValuesLoaded = false;
  public uniqueValues: { value: string; selected: boolean }[] = [];

  public allUniqueValuesSelected = false;
  public someUniqueValuesSelected = false;

  public attributeFilterForm = this.fb.group<{
    condition: string;
    value: string | DateTime;
    value2: string | DateTime;
    caseSensitive: boolean;
    invertCondition: boolean;
  }>({
    condition: '',
    value: '',
    value2: '',
    caseSensitive: false,
    invertCondition: false,
  });

  private _attributeType: FeatureAttributeTypeEnum | null = null;

  private destroyed = new Subject();

  public filteredConditions: FilterConditionModel[] = [];

  private formValues: FilterData = {};
  public trackByIndex = (idx: number) => idx;

  constructor(private fb: FormBuilder) {}

  public ngOnInit(): void {
    this.attributeFilterForm.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        debounceTime(250),
        tap(formValues => {
          if (this.formValues.condition !== formValues.condition && formValues.condition === FilterConditionEnum.UNIQUE_VALUES_KEY) {
            this.initUniqueValues();
          }
        }),
      )
      .subscribe(formValues => {
        const condition = this.filteredConditions.find(c => c.condition === formValues.condition);
        if (!formValues.condition || !condition) {
          return;
        }
        let value = [this.mapValueToString(formValues.value)];
        if (formValues.value2) {
          value.push(this.mapValueToString(formValues.value2));
        }
        if (formValues.condition === FilterConditionEnum.UNIQUE_VALUES_KEY) {
          value = this.getSelectedUniqueValues();
        }
        const caseSensitive = this.toBoolean(formValues.caseSensitive, false);
        const invertCondition = this.toBoolean(formValues.invertCondition, false);
        const updatedValue = {
          condition: condition.condition,
          value,
          caseSensitive,
          invertCondition,
        };
        this.formValues = { ...updatedValue };
        this.filterChanged.emit({ ...updatedValue });
      });

    this.updateConditions();
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private mapValueToString(inputValue: string | DateTime | undefined | null): string {
    if (inputValue && this.isDateLikeAttributeType() && DateTime.isDateTime(inputValue)) {
      return inputValue.toISODate();
    }
    if (typeof inputValue === 'string') {
      return inputValue;
    }
    return '';
  }

  private initUniqueValues() {
    if (this.loadingUniqueValues || this.uniqueValuesLoaded || !this.hasUniqueValues) {
      return;
    }
    this.loadingUniqueValues = true;
    this.uniqueValuesLoader$.pipe(take(1)).subscribe(uniqueValues => {
      const selectedItems = this.formValues && this.formValues.value && Array.isArray(this.formValues.value)
        ? new Set(this.formValues.value)
        : new Set();
      this.uniqueValues = uniqueValues.map(value => ({ value, selected: selectedItems.has(value) }));
      this.loadingUniqueValues = false;
      this.uniqueValuesLoaded = true;
      this.allUniqueValuesSelected = this.getAllUniqueValuesSelected();
      this.someUniqueValuesSelected = this.getSomeUniqueValuesSelected();
    });
  }

  private getAllUniqueValuesSelected() {
    return this.uniqueValues.every(v => v.selected);
  }

  private getSomeUniqueValuesSelected() {
    return this.uniqueValues.some(v => v.selected);
  }

  public toggleAllUniqueValues() {
    this.someUniqueValuesSelected = false;
    if (this.allUniqueValuesSelected) {
      this.allUniqueValuesSelected = false;
      this.uniqueValues = this.uniqueValues.map(v => ({ ...v, selected: false }));
    } else {
      this.allUniqueValuesSelected = true;
      this.uniqueValues = this.uniqueValues.map(v => ({ ...v, selected: true }));
    }
  }

  public showValueInput() {
    return !this.showUniqueValuesInput()
      && this.formValues.condition !== FilterConditionEnum.NULL_KEY
      && (
        this._attributeType === FeatureAttributeTypeEnum.STRING ||
        this._attributeType === FeatureAttributeTypeEnum.INTEGER ||
        this._attributeType === FeatureAttributeTypeEnum.DOUBLE
      );
  }

  public showCaseSensitiveInput() {
    return this._attributeType === FeatureAttributeTypeEnum.STRING;
  }

  public showInvertConditionInput() {
    return this._attributeType === FeatureAttributeTypeEnum.STRING ||
      this._attributeType === FeatureAttributeTypeEnum.INTEGER ||
      this._attributeType === FeatureAttributeTypeEnum.DOUBLE ||
      this.isDateLikeAttributeType();
  }

  public showValueBetweenInput() {
    return this.showValueInput() && this.formValues.condition === FilterConditionEnum.NUMBER_BETWEEN_KEY;
  }

  public showDateInput() {
    return !this.showUniqueValuesInput()
      && this.isDateLikeAttributeType()
      && this.formValues.condition !== FilterConditionEnum.NULL_KEY;
  }

  public showDateUntilInput() {
    return this.showDateInput() && this.formValues.condition === FilterConditionEnum.DATE_BETWEEN_KEY;
  }

  public showUniqueValuesInput() {
    return this.formValues.condition === FilterConditionEnum.UNIQUE_VALUES_KEY;
  }

  public setDisabledState() {
    if (this._attributeType) {
      this.attributeFilterForm.controls.condition.enable({ emitEvent: false });
      this.attributeFilterForm.controls.value.enable({ emitEvent: false });
    } else {
      this.attributeFilterForm.controls.condition.disable({ emitEvent: false });
      this.attributeFilterForm.controls.value.disable({ emitEvent: false });
    }
  }

  private updateConditions() {
    const attributeType = this._attributeType;
    if (!attributeType) {
      return;
    }
    this.filteredConditions = AttributeFilterHelper.getConditionTypes(this.hasUniqueValues)
      .filter(c => c.attributeType.length === 0 || c.attributeType.includes(attributeType));
  }

  public toggleUniqueValue(uniqueValue: string) {
    this.uniqueValues = this.uniqueValues.map(u => {
      if (u.value === uniqueValue) {
        return { ...u, selected: !u.selected };
      }
      return u;
    });

    this.allUniqueValuesSelected = this.getAllUniqueValuesSelected();
    this.someUniqueValuesSelected = this.getSomeUniqueValuesSelected();

    if (this.formValues.condition === FilterConditionEnum.UNIQUE_VALUES_KEY) {
      this.formValues.value = this.getSelectedUniqueValues();
      this.filterChanged.emit({
        condition: this.formValues.condition,
        value: this.formValues.value,
        caseSensitive: this.formValues.caseSensitive,
        invertCondition: this.formValues.invertCondition,
      });
    }
  }

  private getSelectedUniqueValues(): string[] {
    return (this.uniqueValues || []).filter(val => val.selected).map(val => val.value);
  }

  private isDateLikeAttributeType() {
    return this._attributeType === FeatureAttributeTypeEnum.DATE
      || this._attributeType === FeatureAttributeTypeEnum.TIMESTAMP;
  }

  private toDateTime(input: string | DateTime) {
    if (typeof input === 'string') {
      return DateTime.fromISO(input);
    }
    return input;
  }

  private toBoolean(input: string | boolean | undefined | null, defaultValue: boolean): boolean {
    return typeof input === 'boolean' ? input : defaultValue;
  }

}
