import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tm-admin-update-feature-type-button',
  templateUrl: './update-feature-type-button.component.html',
  styleUrls: ['./update-feature-type-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateFeatureTypeButtonComponent implements OnInit {

  constructor() { }

  public ngOnInit(): void {
  }

}
