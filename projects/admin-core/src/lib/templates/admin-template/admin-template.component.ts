import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'tm-admin-template',
  templateUrl: './admin-template.component.html',
  styleUrls: ['./admin-template.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTemplateComponent {
  @Input()
  public pageTitle = '';

  @Input()
  public cls = '';
}
