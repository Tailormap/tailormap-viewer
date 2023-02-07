import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'tm-admin-template',
  templateUrl: './admin-template.component.html',
  styleUrls: ['./admin-template.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTemplateComponent implements OnInit {

  @Input()
  public pageTitle = '';

  constructor() { }

  public ngOnInit(): void {
  }

}
