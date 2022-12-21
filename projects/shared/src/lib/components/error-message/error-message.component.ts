import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'tm-error-message',
  templateUrl: './error-message.component.html',
  styleUrls: ['./error-message.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorMessageComponent {

  @Input()
  public message: string | undefined;

  @Input()
  public message$: Observable<string | undefined> | undefined;

  @Input()
  public emptyText: string | undefined;

  @Input()
  public friendlyError: boolean | undefined;

}
