import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AttributeType, CheckboxFilterModel, FilterConditionEnum, FilterToolEnum, UpdateBooleanFilterModel, UpdateSliderFilterModel,
} from '@tailormap-viewer/api';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { filter } from 'rxjs';
import { FormHelper } from '../../../helpers/form.helper';

@Component({
  selector: 'tm-admin-application-boolean-filter-form',
  templateUrl: './application-boolean-filter-form.component.html',
  styleUrls: ['./application-boolean-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationBooleanFilterFormComponent implements OnInit {

  @Input()
  public set attributeType(attributeType: AttributeType) {
    if (attributeType === AttributeType.BOOLEAN) {
      this.booleanFilterForm.patchValue(
        {
          value1: true,
          value2: false,
        },
        { emitEvent: false },
      );
      this.updateBooleanFilter.emit({
        filterTool: FilterToolEnum.BOOLEAN,
        condition: FilterConditionEnum.BOOLEAN_TRUE_KEY,
        value1: true,
        value2: false,
      });
      this.booleanFeatureType = true;

    } else {
      this.booleanFilterForm.patchValue(
        {
          value1: '',
          value2: '',
        },
        { emitEvent: false },
      );
      this.booleanFeatureType = false;
    }
  }

  @Input()
  public set booleanFilterSettings(booleanFilterSettings: UpdateSliderFilterModel | CheckboxFilterModel | UpdateBooleanFilterModel | null) {
    if (booleanFilterSettings && booleanFilterSettings.filterTool === FilterToolEnum.BOOLEAN) {
      this.booleanFilterForm.patchValue({
        value1: booleanFilterSettings.value1,
        value2: booleanFilterSettings.value2,
        alias1: booleanFilterSettings.alias1 || '',
        alias2: booleanFilterSettings.alias2 || '',
      }, { emitEvent: false });
    }
  }

  @Input()
  public set uniqueValues(uniqueValues: (string | number | boolean)[] | null) {
    if (uniqueValues) {
      const uniqueValuesStrings = uniqueValues
        .filter(value => typeof value !== "boolean")
        .map(value => String(value));
      this.twoUniqueValues = uniqueValuesStrings.length === 2;
      if (this.twoUniqueValues) {
        this.booleanFilterForm.patchValue({
          value1: uniqueValuesStrings[0],
          value2: uniqueValuesStrings[1],
        }, { emitEvent: true });
      }
    }
  }

  public booleanFeatureType: boolean = true;
  public twoUniqueValues: boolean = true;

  @Output()
  public updateBooleanFilter = new EventEmitter<UpdateBooleanFilterModel>();

  public booleanFilterForm: FormGroup = new FormGroup({
    value1: new FormControl<string | boolean>(''),
    value2: new FormControl<string | boolean>(''),
    alias1: new FormControl<string>(''),
    alias2: new FormControl<string>(''),
  });

  constructor(private destroyRef: DestroyRef) { }

  public ngOnInit(): void {
    this.booleanFilterForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        filter(() => this.isValidBooleanFilterForm()),
      )
      .subscribe(value => {
        const condition = value.value1 === true ? FilterConditionEnum.BOOLEAN_TRUE_KEY : FilterConditionEnum.STRING_EQUALS_KEY;
        this.updateBooleanFilter.emit({
          filterTool: FilterToolEnum.BOOLEAN,
          condition: condition,
          value1: value.value1,
          value2: value.value2,
          alias1: value.alias1 || undefined,
          alias2: value.alias2 || undefined,
        });
      });
  }

  private isValidBooleanFilterForm(): boolean {

    const formValues = this.booleanFilterForm.getRawValue();
    return (formValues.value1 === true || FormHelper.isValidValue(formValues.value1))
      && (formValues.value2 === false || FormHelper.isValidValue(formValues.value2))
      && formValues.value1 !== formValues.value2;
  }
}
