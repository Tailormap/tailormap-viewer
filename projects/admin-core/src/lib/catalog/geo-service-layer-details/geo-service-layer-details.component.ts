import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tm-admin-geo-service-layer-details',
  templateUrl: './geo-service-layer-details.component.html',
  styleUrls: ['./geo-service-layer-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoServiceLayerDetailsComponent implements OnInit {

  constructor() { }

  public ngOnInit(): void {
  }

}
