import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tm-admin-geo-registry-page',
  templateUrl: './geo-registry-page.component.html',
  styleUrls: ['./geo-registry-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoRegistryPageComponent implements OnInit {

  constructor() { }

  public ngOnInit(): void {
  }

}
