import { ChangeDetectionStrategy, Component, computed, DestroyRef, EventEmitter, Input, input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { AttributeType, CheckboxFilterModel, FilterConditionEnum, FilterToolEnum, SliderFilterModel } from '@tailormap-viewer/api';
import { AttributeFilterHelper } from '@tailormap-viewer/shared';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, filter } from 'rxjs';
import { FormHelper } from '../../../helpers/form.helper';

@Component({
  selector: 'tm-admin-application-slider-filter-form',
  templateUrl: './application-slider-filter-form.component.html',
  styleUrls: ['./application-slider-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationSliderFilterFormComponent implements OnInit {

  public attributeType = input<AttributeType>(AttributeType.INTEGER);
  public filterConditions = computed(() => {
    const attributeType = this.attributeType();
    return AttributeFilterHelper.getConditionTypes().filter(c => c.attributeType.length === 0 || c.attributeType.includes(attributeType));
  });

  @Input()
  public set sliderFilter(configuration: SliderFilterModel | CheckboxFilterModel | null) {
    if (configuration && configuration.filterTool === FilterToolEnum.SLIDER) {
      this.sliderFilterForm.patchValue({
        condition: configuration.condition,
        initialValue: configuration.initialValue,
        minimumValue: configuration.minimumValue,
        maximumValue: configuration.maximumValue,
      }, { emitEvent: false });
    }

  }

  @Output()
  public updateSliderFilter = new EventEmitter<SliderFilterModel>();

  constructor(private destroyRef: DestroyRef) { }

  public sliderFilterForm = new FormGroup({
    condition: new FormControl<FilterConditionEnum | null>(null),
    initialValue: new FormControl<number | null>(null),
    minimumValue: new FormControl<number | null>(null),
    maximumValue: new FormControl<number | null>(null),
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
          initialValue: value.initialValue ?? 0,
          minimumValue: value.minimumValue ?? 0,
          maximumValue: value.maximumValue ?? 0,
        });
      });
  }

  private isValidSliderForm(): boolean {
    const formValues = this.sliderFilterForm.getRawValue();
    return !!formValues.condition
      && FormHelper.isValidNumberValue(formValues.initialValue)
      && FormHelper.isValidNumberValue(formValues.minimumValue)
      && FormHelper.isValidNumberValue(formValues.maximumValue);
  }

}
