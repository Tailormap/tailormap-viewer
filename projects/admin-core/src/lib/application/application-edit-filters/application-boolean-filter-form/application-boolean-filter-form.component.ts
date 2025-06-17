import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, input, OnInit, Output } from '@angular/core';
import { AttributeType, BooleanFilterModel, FilterConditionEnum, FilterToolEnum, UpdateBooleanFilterModel } from '@tailormap-viewer/api';
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
        { emitEvent: true },
      );
      this.booleanFeatureType = true;
      this.booleanFilterForm.markAsDirty();
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
  public set booleanFilterSettings(booleanFilterSettings: BooleanFilterModel | null) {
    if (booleanFilterSettings) {
      this.booleanFilterForm.patchValue({
        value1: booleanFilterSettings.value1,
        value2: booleanFilterSettings.value2,
        alias1: booleanFilterSettings.alias1 || '',
        alias2: booleanFilterSettings.alias2 || '',
      }, { emitEvent: false });
    }
  }

  public uniqueValues = input<(string | number | boolean)[] | null>(null);
  public booleanFeatureType: boolean = true;

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
    console.log("value 1 valid: ", (formValues.value1 === true || FormHelper.isValidValue(formValues.value1)));
    console.log("value 2 valid: ", (formValues.value2 === false || FormHelper.isValidValue(formValues.value2)));
    console.log("value 1 != value 2: ", formValues.value1 !== formValues.value2);
    return (formValues.value1 === true || FormHelper.isValidValue(formValues.value1))
      && (formValues.value2 === false || FormHelper.isValidValue(formValues.value2))
      && formValues.value1 !== formValues.value2;
  }
}
