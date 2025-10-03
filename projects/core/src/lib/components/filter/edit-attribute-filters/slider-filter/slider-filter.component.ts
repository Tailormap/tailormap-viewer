import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FilterConditionEnum, SliderFilterInputModeEnum, UpdateSliderFilterModel } from '@tailormap-viewer/api';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'tm-slider-filter',
  templateUrl: './slider-filter.component.html',
  styleUrls: ['./slider-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SliderFilterComponent implements OnInit {
  private destroyRef = inject(DestroyRef);


  public minValue: number = 0;
  public maxValue: number = 100;
  public stepSize: number = 1;
  public inputMode: SliderFilterInputModeEnum = SliderFilterInputModeEnum.SLIDER;
  public betweenInput: boolean = false;
  public static readonly MAX_PRECISION = 5;
  public displayWith: ((value: number) => string) = (value: number) => {
    if (value.toString().length <= SliderFilterComponent.MAX_PRECISION) {
      return value.toString();
    }
    return value.toPrecision(SliderFilterComponent.MAX_PRECISION);
  };

  @Input()
  public set sliderFilterConfiguration(config: UpdateSliderFilterModel) {
    this.minValue = config.minimumValue;
    this.maxValue = config.maximumValue;
    this.stepSize = config.stepSize || (config.maximumValue - config.minimumValue) / 50;
    this.inputMode = config.inputMode || SliderFilterInputModeEnum.SLIDER;
    this.betweenInput = config.condition === FilterConditionEnum.NUMBER_BETWEEN_KEY
      || (!(config.initialLowerValue === null || config.initialLowerValue === undefined)
        && !(config.initialUpperValue === null || config.initialUpperValue === undefined));
    this.initForm(config.initialValue ?? null, config.initialLowerValue ?? null, config.initialUpperValue ?? null);
  }

  @Output()
  public valueChange = new EventEmitter<number | null>();

  @Output()
  public betweenValuesChange = new EventEmitter<{lower: number | null; upper: number | null}>();

  public viewerSliderFilterForm = new FormGroup({
    filterValue: new FormControl<number | null>(null),
    lowerValue: new FormControl<number | null>(null),
    upperValue: new FormControl<number | null>(null),
  });

  public ngOnInit(): void {
    this.viewerSliderFilterForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
      )
      .subscribe(value => {
        console.debug("Slider filter value changed", value);
        if (this.betweenInput) {
          this.betweenValuesChange.emit({ lower: value.lowerValue ?? this.minValue, upper: value.upperValue ?? this.maxValue });
          this.viewerSliderFilterForm.patchValue({
            lowerValue: value.lowerValue ?? this.minValue,
            upperValue: value.upperValue ?? this.maxValue,
          }, { emitEvent: false });
        } else {
          this.valueChange.emit(value.filterValue ?? null);
        }
      });
  }

  private initForm(filterValue: number | null, lowerValue: number | null, upperValue: number | null) {
    // If only one of the upper and lower values is set, the other is set to min/max to get a valid filter,
    // if neither are set, both remain null.
    this.viewerSliderFilterForm.patchValue({
      filterValue,
      lowerValue: upperValue !== null
        ? lowerValue ?? this.minValue
        : lowerValue,
      upperValue: lowerValue !== null
        ? upperValue ?? this.maxValue
        : upperValue,
    }, { emitEvent: false });
  }

  public changeValue(value: number) {
    this.viewerSliderFilterForm.patchValue({ filterValue: Number(value.toPrecision(SliderFilterComponent.MAX_PRECISION)) }, { emitEvent: true });
  }

  public changeBetweenValues($event: {lower: number; upper: number}) {
    this.viewerSliderFilterForm.patchValue({
      lowerValue: Number($event.lower.toPrecision(SliderFilterComponent.MAX_PRECISION)),
      upperValue: Number($event.upper.toPrecision(SliderFilterComponent.MAX_PRECISION)),
    }, { emitEvent: true });
  }

}
