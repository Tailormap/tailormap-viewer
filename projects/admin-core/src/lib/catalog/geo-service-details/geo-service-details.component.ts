import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tm-admin-geo-service-details',
  templateUrl: './geo-service-details.component.html',
  styleUrls: ['./geo-service-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoServiceDetailsComponent implements OnInit {

  constructor() { }

  public ngOnInit(): void {
  }

}
