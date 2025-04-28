import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
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

  public filterableLayers$: Observable<ExtendedGeoServiceLayerModel[]>;

  constructor(private store$: Store) {
    this.filterableLayers$ = this.store$.select(selectFilterableLayersForApplication);
  }

}
