import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { SliderFilterModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-slider-filter',
  templateUrl: './slider-filter.component.html',
  styleUrls: ['./slider-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SliderFilterComponent {

  public minValue: number = 0;
  public maxValue: number = 100;
  public stepValue: number = 1;
  public initialValue: number = 0;
  public initialLowerValue?: number;
  public initialUpperValue?: number;

  private lowerValue: number = 0;
  private upperValue: number = 100;

  @Input()
  public set sliderFilterConfiguration(config: SliderFilterModel) {
    this.minValue = config.minimumValue;
    this.maxValue = config.maximumValue;
    this.initialValue = config.initialValue || config.minimumValue;
    this.stepValue = (config.maximumValue - config.minimumValue) / 100;
    this.initialLowerValue = config.initialLowerValue;
    this.initialUpperValue = config.initialUpperValue;
    this.lowerValue = config.initialLowerValue || config.minimumValue;
    this.upperValue = config.initialUpperValue || config.maximumValue;
  }

  @Output()
  public valueChange = new EventEmitter<number>();

  @Output()
  public betweenValuesChange = new EventEmitter<{lower: number; upper: number}>();

  constructor() { }

  public changeValue(value: number) {
    this.valueChange.emit(value);
  }

  public changeBetweenValues($event: {lower: number; upper: number}) {
    this.betweenValuesChange.emit($event);
  }

}
