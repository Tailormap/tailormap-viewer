import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { AttributeFilterModel, FilterConditionEnum, FilterToolEnum, SliderFilterInputModeEnum } from '@tailormap-viewer/api';
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
  public initialValue: number | null = null;
  public initialLowerValue: number | null = null;
  public initialUpperValue: number | null = null;
  public inputMode: SliderFilterInputModeEnum = SliderFilterInputModeEnum.SLIDER;
  public betweenInput: boolean = false;
  public static readonly MAX_PRECISION = 5;
  public displayWith: ((value: number) => string) = (value: number) => value.toPrecision(SliderFilterComponent.MAX_PRECISION);

  @Input()
  public set sliderFilter(filter: AttributeFilterModel) {
    if (filter.editConfiguration?.filterTool !== FilterToolEnum.SLIDER) {
      return;
    }
    this.minValue = filter.editConfiguration.minimumValue;
    this.maxValue = filter.editConfiguration.maximumValue;
    this.stepSize = filter.editConfiguration.stepSize || (filter.editConfiguration.maximumValue - filter.editConfiguration.minimumValue) / 50;
    this.inputMode = filter.editConfiguration.inputMode || SliderFilterInputModeEnum.SLIDER;
    this.betweenInput = filter.condition === FilterConditionEnum.NUMBER_BETWEEN_KEY;
    if (!this.betweenInput) {
      this.initialValue = filter.value[0] ? Number(filter.value[0]) : filter.editConfiguration.minimumValue;
    } else {
      this.initialLowerValue = filter.value[0] ? Number(filter.value[0]) : filter.editConfiguration.minimumValue;
      this.initialUpperValue = filter.value[1] ? Number(filter.value[1]) : filter.editConfiguration.maximumValue;
    }
  }

  @Output()
  public valueChange = new EventEmitter<number>();

  @Output()
  public betweenValuesChange = new EventEmitter<{lower: number; upper: number}>();

  public viewerSliderFilterForm = new FormGroup({
    filterValue: new FormControl<number | null>(null),
    lowerValue: new FormControl<number | null>(null),
    upperValue: new FormControl<number | null>(null),
  });

  public ngOnInit(): void {
    this.viewerSliderFilterForm.patchValue({
      filterValue: this.initialValue,
      lowerValue: this.initialLowerValue,
      upperValue: this.initialUpperValue,
    }, { emitEvent: false });

    this.viewerSliderFilterForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
      )
      .subscribe(value => {
        if (this.betweenInput) {
          this.betweenValuesChange.emit({ lower: value.lowerValue ?? 0, upper: value.upperValue ?? 0 });
        } else {
          this.valueChange.emit(value.filterValue ?? 0);
        }
      });
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
