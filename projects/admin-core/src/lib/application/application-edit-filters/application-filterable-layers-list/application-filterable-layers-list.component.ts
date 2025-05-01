import { Component, ChangeDetectionStrategy, Signal, EventEmitter, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFilterableLayersForApplication } from '../../state/application.selectors';
import { ExtendedGeoServiceLayerModel } from '../../../catalog/models/extended-geo-service-layer.model';

@Component({
  selector: 'tm-admin-filterable-layers-list',
  templateUrl: './application-filterable-layers-list.component.html',
  styleUrls: ['./application-filterable-layers-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationFilterableLayersListComponent {

  public filterableLayers: Signal<{geoServiceLayer: ExtendedGeoServiceLayerModel | undefined; appLayerId: string }[]> =
    this.store$.selectSignal(selectFilterableLayersForApplication);

  @Output()
  public selectLayer = new EventEmitter<{geoServiceLayer: ExtendedGeoServiceLayerModel | undefined; appLayerId: string }>();

  constructor(private store$: Store) {}

  public setSelectedLayer(layer: {geoServiceLayer: ExtendedGeoServiceLayerModel | undefined; appLayerId: string }) {
    if (!layer) {
      return;
    }
    this.selectLayer.emit(layer);
  }
}
