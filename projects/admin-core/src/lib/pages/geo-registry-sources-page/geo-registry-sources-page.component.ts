import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tm-admin-geo-registry-sources-page',
  templateUrl: './geo-registry-sources-page.component.html',
  styleUrls: ['./geo-registry-sources-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoRegistrySourcesPageComponent implements OnInit {

  constructor() { }

  public ngOnInit(): void {
  }

}
