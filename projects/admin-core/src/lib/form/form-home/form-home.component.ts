import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tm-admin-form-home',
  templateUrl: './form-home.component.html',
  styleUrls: ['./form-home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormHomeComponent implements OnInit {

  constructor() { }

  public ngOnInit(): void {
  }

}
