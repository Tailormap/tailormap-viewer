import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tm-admin-application-checkbox-filter-form',
  templateUrl: './application-checkbox-filter-form.component.html',
  styleUrls: ['./application-checkbox-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationCheckboxFilterFormComponent implements OnInit {

  constructor() { }

  public ngOnInit(): void {
    return;
  }

}
