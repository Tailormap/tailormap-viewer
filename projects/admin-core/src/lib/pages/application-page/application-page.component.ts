import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tm-admin-application-page',
  templateUrl: './application-page.component.html',
  styleUrls: ['./application-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationPageComponent implements OnInit {

  constructor() { }

  public ngOnInit(): void {
  }

}
