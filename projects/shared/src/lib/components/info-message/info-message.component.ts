import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'tm-info-message',
  templateUrl: './info-message.component.html',
  styleUrls: ['./info-message.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoMessageComponent {
  @Input()
  public message: string | undefined | null;
}
