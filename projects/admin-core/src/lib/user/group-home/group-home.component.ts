import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tm-admin-group-home',
  templateUrl: './group-home.component.html',
  styleUrls: ['./group-home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupHomeComponent implements OnInit {

  constructor() { }

  public ngOnInit(): void {
  }

}
