import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tm-admin-home-page',
  templateUrl: './admin-home-page.component.html',
  styleUrls: ['./admin-home-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHomePageComponent implements OnInit {

  constructor() { }

  public ngOnInit(): void {
  }

}
