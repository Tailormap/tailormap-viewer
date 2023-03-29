import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tm-admin-groups-page',
  templateUrl: './groups-page.component.html',
  styleUrls: ['./groups-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupsPageComponent implements OnInit {

  constructor() { }

  public ngOnInit(): void {
  }

}
