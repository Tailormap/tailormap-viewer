import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'tm-error-message',
  templateUrl: './error-message.component.html',
  styleUrls: ['./error-message.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ErrorMessageComponent {

  @Input()
  public message: string | undefined | null;

  @Input()
  public message$: Observable<string | undefined> | undefined;

  @Input()
  public emptyText: string | undefined;

  @Input()
  public friendlyError: boolean | undefined;

  @Input()
  public showContent: boolean | undefined;
}
