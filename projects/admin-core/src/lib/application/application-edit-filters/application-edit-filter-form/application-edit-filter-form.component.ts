import { Component, ChangeDetectionStrategy, Input, WritableSignal, signal } from '@angular/core';
import { AttributeFilterModel } from '@tailormap-viewer/api';
import { ExtendedGeoServiceLayerModel } from '../../../catalog/models/extended-geo-service-layer.model';

@Component({
  selector: 'tm-admin-application-edit-filter-form',
  templateUrl: './application-edit-filter-form.component.html',
  styleUrls: ['./application-edit-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationEditFilterFormComponent {

  @Input()
  public filter: AttributeFilterModel | null = null;

  public selectedLayer: WritableSignal<ExtendedGeoServiceLayerModel | null> = signal(null);

  constructor() { }

  setSelectedLayer($event: ExtendedGeoServiceLayerModel) {
    this.selectedLayer.set($event);
  }
}
