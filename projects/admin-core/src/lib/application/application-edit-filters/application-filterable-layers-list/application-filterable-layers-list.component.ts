import { Component, ChangeDetectionStrategy, EventEmitter, Output, Input } from '@angular/core';
import { GeoServiceLayerInApplicationModel } from '../../models/geo-service-layer-in-application.model';

@Component({
  selector: 'tm-admin-filterable-layers-list',
  templateUrl: './application-filterable-layers-list.component.html',
  styleUrls: ['./application-filterable-layers-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationFilterableLayersListComponent {

  @Input()
  public filterableLayers: GeoServiceLayerInApplicationModel[] = [];

  @Output()
  public selectLayer = new EventEmitter<GeoServiceLayerInApplicationModel>();

  constructor() { }

  public setSelectedLayer(layer: GeoServiceLayerInApplicationModel) {
    if (!layer) {
      return;
    }
    this.selectLayer.emit(layer);
  }

}
