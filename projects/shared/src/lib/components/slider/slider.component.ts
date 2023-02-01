import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, NgZone } from '@angular/core';

@Component({
  selector: 'tm-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderComponent {

  @Input()
  public min = 0;

  @Input()
  public max = 100;

  @Input()
  public step = 1;

  @Input()
  public displayWith: ((value: number) => string) = (value: number) => value.toString();

  @Input()
  public value: number | undefined | null;

  @Output()
  public valueChange = new EventEmitter<number>();

  constructor(
    private ngZone: NgZone,
  ) { }

  public onValueChange(value: number) {
    this.ngZone.run(() => this.valueChange.emit(value));
  }

}
