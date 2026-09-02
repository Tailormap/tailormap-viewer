import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SpinnerButtonComponent } from '../../../../../../shared/src/lib/components/spinner-button/spinner-button.component';

@Component({
    selector: 'tm-admin-save-button',
    templateUrl: './save-button.component.html',
    styleUrls: ['./save-button.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SpinnerButtonComponent],
})
export class SaveButtonComponent {

  @Input()
  public saving$: Observable<boolean> = of(false);

  @Input()
  public disabled: boolean | null = false;

  @Input()
  public label: string = $localize `:@@admin-core.common.save:Save`;

  @Output()
  public save = new EventEmitter();

  public saveClicked() {
    if (this.disabled) {
      return;
    }
    this.save.emit();
  }

}
