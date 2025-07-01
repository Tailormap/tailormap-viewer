import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import {
  AttributeType, AttributeTypeHelper, CheckboxFilterModel, FilterConditionEnum, FilterToolEnum, UpdateSwitchFilterModel,
  UpdateSliderFilterModel, UpdateDatePickerFilterModel,
} from '@tailormap-viewer/api';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { filter } from 'rxjs';
import { FormHelper } from '../../../helpers/form.helper';

@Component({
  selector: 'tm-admin-application-switch-filter-form',
  templateUrl: './application-switch-filter-form.component.html',
  styleUrls: ['./application-switch-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationSwitchFilterFormComponent implements OnInit {
  private destroyRef = inject(DestroyRef);


  @Input()
  public set attributeType(attributeType: AttributeType) {
    if (attributeType === AttributeType.BOOLEAN) {
      this.switchFilterForm.patchValue(
        {
          value1: true,
          value2: false,
        },
        { emitEvent: false },
      );
      this.updateSwitchFilter.emit({
        filterTool: FilterToolEnum.SWITCH,
        condition: FilterConditionEnum.BOOLEAN_TRUE_KEY,
      });
      this.booleanFeatureType = true;
    } else {
      this.switchFilterForm.patchValue(
        {
          value1: '',
          value2: '',
        },
        { emitEvent: false },
      );
      this.booleanFeatureType = false;
      this.condition = AttributeTypeHelper.isNumericType(attributeType)
        ? FilterConditionEnum.NUMBER_EQUALS_KEY
        : FilterConditionEnum.STRING_EQUALS_KEY;
    }
  }

  @Input()
  public set switchFilterSettings(
    switchFilterSettings: UpdateSliderFilterModel | CheckboxFilterModel | UpdateSwitchFilterModel | UpdateDatePickerFilterModel | null,
  ) {
    if (switchFilterSettings && switchFilterSettings.filterTool === FilterToolEnum.SWITCH) {
      this.switchFilterForm.patchValue({
        value1: switchFilterSettings.value1,
        value2: switchFilterSettings.value2,
        alias1: switchFilterSettings.alias1 || '',
        alias2: switchFilterSettings.alias2 || '',
      }, { emitEvent: false });
      this.condition = switchFilterSettings.condition || FilterConditionEnum.BOOLEAN_TRUE_KEY;
      if ((switchFilterSettings.value1 === undefined || switchFilterSettings.value1 === null)
        && (switchFilterSettings.value2 === undefined || switchFilterSettings.value2 === null)) {
        this.switchFilterForm.patchValue({
          value1: true,
          value2: false,
        }, { emitEvent: true });
        this.booleanFeatureType = true;
      } else {
        this.booleanFeatureType = false;
      }
    }
  }

  @Input()
  public set uniqueValues(uniqueValues: (string | number | boolean)[] | null) {
    if (uniqueValues) {
      const uniqueValuesStrings = uniqueValues.map(value => String(value));
      this.twoUniqueValues = uniqueValuesStrings.length === 2;
      if (this.twoUniqueValues) {
        this.switchFilterForm.patchValue({
          value1: uniqueValuesStrings[0],
          value2: uniqueValuesStrings[1],
        }, { emitEvent: true });
      }
    }
  }

  public booleanFeatureType: boolean = true;
  public twoUniqueValues: boolean = true;
  private condition: FilterConditionEnum = FilterConditionEnum.BOOLEAN_TRUE_KEY;

  @Output()
  public updateSwitchFilter = new EventEmitter<UpdateSwitchFilterModel>();

  public switchFilterForm: FormGroup = new FormGroup({
    value1: new FormControl<string | boolean>(''),
    value2: new FormControl<string | boolean>(''),
    alias1: new FormControl<string>(''),
    alias2: new FormControl<string>(''),
    startWithValue2: new FormControl<boolean>(false),
  });

  public ngOnInit(): void {
    this.switchFilterForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        filter(() => this.isValidSwitchFilterForm()),
      )
      .subscribe(value => {
        this.updateSwitchFilter.emit({
          filterTool: FilterToolEnum.SWITCH,
          condition: this.condition,
          value1: typeof value.value1 === 'string' ? value.value1 : undefined,
          value2: typeof value.value2 === 'string' ? value.value2 : undefined,
          alias1: value.alias1 || undefined,
          alias2: value.alias2 || undefined,
          startWithValue2: value.startWithValue2,
        });
      });
  }

  private isValidSwitchFilterForm(): boolean {
    const formValues = this.switchFilterForm.getRawValue();
    return (formValues.value1 === true || FormHelper.isValidValue(formValues.value1))
      && (formValues.value2 === false || FormHelper.isValidValue(formValues.value2))
      && formValues.value1 !== formValues.value2;
  }

  public startWithValue2Changed(startWithValue2: boolean): void {
    if (this.booleanFeatureType) {
      this.condition = startWithValue2 ? FilterConditionEnum.BOOLEAN_FALSE_KEY : FilterConditionEnum.BOOLEAN_TRUE_KEY;
    }
  }
}
