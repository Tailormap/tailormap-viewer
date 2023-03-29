import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tm-admin-user-admin-page',
  templateUrl: './user-admin-page.component.html',
  styleUrls: ['./user-admin-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAdminPageComponent implements OnInit {

  constructor() { }

  public ngOnInit(): void {
  }

}
