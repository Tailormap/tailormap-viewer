import { ChangeDetectionStrategy, Component, computed, DestroyRef, EventEmitter, Input, input, OnInit, Output, inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  AttributeType, FilterConditionEnum, FilterToolEnum, UpdateSliderFilterModel, SliderFilterInputModeEnum, EditFilterConfigurationModel,
} from '@tailormap-viewer/api';
import { AttributeFilterHelper } from '@tailormap-viewer/shared';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, filter } from 'rxjs';
import { FormHelper } from '../../../../helpers/form.helper';

@Component({
  selector: 'tm-admin-application-slider-filter-form',
  templateUrl: './application-slider-filter-form.component.html',
  styleUrls: ['./application-slider-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationSliderFilterFormComponent implements OnInit {
  private destroyRef = inject(DestroyRef);


  public attributeType = input<AttributeType>(AttributeType.INTEGER);
  public filterConditions = computed(() => {
    const attributeType = this.attributeType();
    return AttributeFilterHelper.getConditionTypes().filter(c => c.attributeType.length === 0 || c.attributeType.includes(attributeType));
  });

  private minimumUniqueValue: number | null = null;
  private maximumUniqueValue: number | null = null;

  public inputModeOptions = [{
    value: SliderFilterInputModeEnum.SLIDER,
    label: $localize`:@@admin-core.application.filters.slider.slider:Slider`,
  }, {
    value: SliderFilterInputModeEnum.INPUT_FIELD,
    label: $localize`:@@admin-core.application.filters.slider.input-field:Input field`,
  }, {
    value: SliderFilterInputModeEnum.SLIDER_AND_INPUT_FIELD,
    label: $localize`:@@admin-core.application.filters.slider.slider-input-field:Slider and input field`,
  }];

  @Input()
  public set sliderFilter(
    configuration: EditFilterConfigurationModel | null,
  ) {
    if (configuration && configuration.filterTool === FilterToolEnum.SLIDER) {
      this.sliderFilterForm.patchValue({
        condition: configuration.condition,
        initialValue: configuration.initialValue,
        minimumValue: configuration.minimumValue,
        maximumValue: configuration.maximumValue,
        initialLowerValue: configuration.initialLowerValue,
        initialUpperValue: configuration.initialUpperValue,
        inputMode: configuration.inputMode ?? SliderFilterInputModeEnum.SLIDER,
      }, { emitEvent: false });
    }
  }

  @Input()
  public set uniqueValues(uniqueValues: (string | number | boolean)[] | null) {
    const uniqueValuesNumbers = uniqueValues?.filter(v => typeof v === 'number');
    if (uniqueValuesNumbers && uniqueValuesNumbers.length > 0) {
      this.minimumUniqueValue = Math.min(...uniqueValuesNumbers);
      this.maximumUniqueValue = Math.max(...uniqueValuesNumbers);
    }
  }

  @Output()
  public updateSliderFilter = new EventEmitter<UpdateSliderFilterModel>();

  public sliderFilterForm = new FormGroup({
    condition: new FormControl<FilterConditionEnum | null>(null),
    initialValue: new FormControl<number | null>(null),
    minimumValue: new FormControl<number | null>(null),
    maximumValue: new FormControl<number | null>(null),
    initialLowerValue: new FormControl<number | null>(null),
    initialUpperValue: new FormControl<number | null>(null),
    inputMode: new FormControl<SliderFilterInputModeEnum>(SliderFilterInputModeEnum.SLIDER),
  });

  public ngOnInit(): void {
    this.sliderFilterForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        filter(() => this.isValidSliderForm()),
      )
      .subscribe((value) => {
        this.updateSliderFilter.emit({
          filterTool: FilterToolEnum.SLIDER,
          condition: value.condition ?? FilterConditionEnum.NULL_KEY,
          initialValue: value.condition !== FilterConditionEnum.NUMBER_BETWEEN_KEY ? (value.initialValue) : undefined,
          minimumValue: value.minimumValue ?? 0,
          maximumValue: value.maximumValue ?? 0,
          initialLowerValue: value.condition === FilterConditionEnum.NUMBER_BETWEEN_KEY ? (value.initialLowerValue) : undefined,
          initialUpperValue: value.condition === FilterConditionEnum.NUMBER_BETWEEN_KEY ? (value.initialUpperValue) : undefined,
          inputMode: value.inputMode ?? SliderFilterInputModeEnum.SLIDER,
        });
      });
  }

  private isValidSliderForm(): boolean {
    const formValues = this.sliderFilterForm.getRawValue();
    console.debug("form values: ", formValues);
    console.debug("valid initial values: ", (formValues.initialValue !== null && formValues.initialValue !== undefined) ||
      ((formValues.initialLowerValue !== null && formValues.initialLowerValue !== undefined)
        === (formValues.initialUpperValue !== null && formValues.initialUpperValue !== undefined)));
    return !!formValues.condition
      && ((formValues.initialValue !== null && formValues.initialValue !== undefined) ||
        ((formValues.initialLowerValue !== null && formValues.initialLowerValue !== undefined)
          === (formValues.initialUpperValue !== null && formValues.initialUpperValue !== undefined)))
      && FormHelper.isValidNumberValue(formValues.minimumValue)
      && FormHelper.isValidNumberValue(formValues.maximumValue);
  }

  public isBetweenCondition(): boolean {
    return this.sliderFilterForm.get('condition')?.value === FilterConditionEnum.NUMBER_BETWEEN_KEY;
  }

  public setRangeToAttributeRange(): void {
    if (this.minimumUniqueValue !== null && this.maximumUniqueValue !== null) {
      this.sliderFilterForm.patchValue({
        minimumValue: this.minimumUniqueValue,
        maximumValue: this.maximumUniqueValue,
      }, { emitEvent: true });
    }
  }

  public setBetweenRangeToAttributeRange(): void {
    if (this.minimumUniqueValue !== null && this.maximumUniqueValue !== null) {
      this.sliderFilterForm.patchValue({
        initialLowerValue: this.minimumUniqueValue,
        initialUpperValue: this.maximumUniqueValue,
      }, { emitEvent: true });
      this.sliderFilterForm.markAsDirty();
    }
  }

}
