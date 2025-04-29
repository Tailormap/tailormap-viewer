import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { AttributeFilterModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-admin-application-edit-filter-form',
  templateUrl: './application-edit-filter-form.component.html',
  styleUrls: ['./application-edit-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationEditFilterFormComponent {

  @Input()
  public filter: AttributeFilterModel | null = null;

  constructor() { }

}
