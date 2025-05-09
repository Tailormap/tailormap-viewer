import { Component, ChangeDetectionStrategy, Signal, computed, signal } from '@angular/core';
import { AttributeFilterModel, FilterGroupModel, FilterTypeEnum } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { createApplicationFilterGroup } from '../../state/application.actions';
import {
  selectApplicationSelectedFilterLayerId, selectFilterableLayersForApplication, selectSelectedApplicationId,
} from '../../state/application.selectors';
import { nanoid } from 'nanoid';
import { GeoServiceLayerInApplicationModel } from '../../models/geo-service-layer-in-application.model';
import { UpdateAttributeFilterModel } from '../../models/update-attribute-filter.model';

// test

@Component({
  selector: 'tm-admin-application-create-filter',
  templateUrl: './application-create-filter.component.html',
  styleUrls: ['./application-create-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationCreateFilterComponent {

  private filterGroup: FilterGroupModel<AttributeFilterModel> | null = null;

  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);
  public filterableLayers: Signal<GeoServiceLayerInApplicationModel[]> = this.store$.selectSignal(selectFilterableLayersForApplication);
  public selectedLayerId: Signal<string | undefined> = this.store$.selectSignal(selectApplicationSelectedFilterLayerId);

  public saveEnabled = signal(false);

  private newFilterId = signal<string>(nanoid());
  public newFilter: Signal<UpdateAttributeFilterModel | null> = computed(() => {
    const selectedLayerId = this.selectedLayerId();
    const newFilterId = this.newFilterId();
    if (!selectedLayerId) {
      return null;
    }
    return {
      filterGroup: {
        id: nanoid(),
        source: "PRESET",
        layerIds: [selectedLayerId ?? ''],
        type: FilterTypeEnum.ATTRIBUTE,
        filters: [],
        operator: 'AND',
      },
      filterId: newFilterId,
    };
  });

  constructor(private store$: Store) { }

  public save() {
    if (!this.filterGroup) {
      return;
    }
    this.store$.dispatch(createApplicationFilterGroup({ filterGroup: this.filterGroup }));
    this.setUpNewFilter();
  }

  public updateFilter($event: FilterGroupModel<AttributeFilterModel>) {
    this.filterGroup = $event;
  }

  public validFormChanged($event: boolean) {
    this.saveEnabled.set($event);
  }

  private setUpNewFilter() {
    this.newFilterId.set(nanoid());
  }
}
