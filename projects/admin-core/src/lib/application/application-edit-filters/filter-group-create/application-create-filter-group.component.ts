import { Component, ChangeDetectionStrategy, Signal, computed, signal } from '@angular/core';
import { AttributeFilterModel, FilterGroupModel, FilterTypeEnum } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { createApplicationAttributeFilterGroup } from '../../state/application.actions';
import {
  selectFilterableLayersForApplication, selectSelectedApplicationId,
} from '../../state/application.selectors';
import { nanoid } from 'nanoid';
import { GeoServiceLayerInApplicationModel } from '../../models/geo-service-layer-in-application.model';
import { MatSelectionListChange } from '@angular/material/list';

@Component({
  selector: 'tm-admin-application-create-filter-group',
  templateUrl: './application-create-filter-group.component.html',
  styleUrls: ['./application-create-filter-group.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationCreateFilterGroupComponent {

  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);
  public filterableLayers: Signal<GeoServiceLayerInApplicationModel[]> = this.store$.selectSignal(selectFilterableLayersForApplication);
  public selectedLayers = signal<string[]>([]);
  public layerList: Signal<Array<GeoServiceLayerInApplicationModel & { selected: boolean }>> = computed(() => {
    const filterableLayers = this.filterableLayers();
    const selectedLayerIds = this.selectedLayers();
    return filterableLayers.map(layer => ({
      ...layer,
      selected: selectedLayerIds.includes(layer.appLayerId),
    }));
  });
  public saveEnabled = computed(() => this.selectedLayers().length > 0);

  constructor(private store$: Store) { }

  public save() {
    const selectedLayerIds = this.selectedLayers();
    if (selectedLayerIds.length === 0) {
      return;
    }
    const filterGroup: FilterGroupModel<AttributeFilterModel> = {
      id: nanoid(),
      source: "PRESET",
      layerIds: selectedLayerIds ?? [],
      type: FilterTypeEnum.ATTRIBUTE,
      filters: [],
      operator: 'AND',
    };
    this.store$.dispatch(createApplicationAttributeFilterGroup({ filterGroup }));
  }

  public onLayerSelectionChange($event: MatSelectionListChange) {
    const selectedLayers = [...this.selectedLayers()];
    $event.options.forEach(option => {
      if (option.selected) {
        selectedLayers.push(option.value);
      } else {
        selectedLayers.splice(selectedLayers.indexOf(option.value), 1);
      }
    });
    this.selectedLayers.set(selectedLayers);
  }
}
