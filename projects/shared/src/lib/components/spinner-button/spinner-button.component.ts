import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'tm-spinner-button',
  templateUrl: './spinner-button.component.html',
  styleUrls: ['./spinner-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SpinnerButtonComponent {

  @Input({ required: true })
  public showSpinner$: Observable<boolean> = of(false);

  @Input()
  public disabled: boolean | null = false;

  @Input({ required: true })
  public label: string = '';

  @Input()
  public color: 'primary' | 'accent' | 'warn' | 'default' = 'primary';

  @Output()
  public buttonClick = new EventEmitter();

  public clicked() {
    if (this.disabled) {
      return;
    }
    this.buttonClick.emit();
  }

}
