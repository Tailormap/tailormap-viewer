import { Component, ChangeDetectionStrategy, Signal, computed, signal, OnInit, DestroyRef, inject } from '@angular/core';
import { AttributeFilterModel, FilterGroupModel, FilterTypeEnum } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { createApplicationAttributeFilterGroup } from '../../state/application.actions';
import {
  selectFilterableLayersForApplication, selectSelectedApplicationId,
} from '../../state/application.selectors';
import { nanoid } from 'nanoid';
import { MatSelectionListChange } from '@angular/material/list';
import { FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FilterHelper } from '@tailormap-viewer/shared';
import { ExtendedAppTreeLayerNodeModel } from '../../models/extended-app-tree-layer-node.model';

@Component({
  selector: 'tm-admin-application-create-filter-group',
  templateUrl: './application-create-filter-group.component.html',
  styleUrls: ['./application-create-filter-group.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationCreateFilterGroupComponent implements OnInit {
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);


  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);
  public filterableLayers: Signal<ExtendedAppTreeLayerNodeModel[]> = this.store$.selectSignal(selectFilterableLayersForApplication);
  public selectedLayers = signal<string[]>([]);

  public layerFilter = new FormControl<string>('');
  public layerFilterSignal = signal<string>('');

  public layerList: Signal<Array<ExtendedAppTreeLayerNodeModel & { selected: boolean }>> = computed(() => {
    const filterableLayers = this.filterableLayers();
    const selectedLayerIds = this.selectedLayers();
    const filterTerm = this.layerFilterSignal();
    const layersWithSelected = filterableLayers.map(layer => ({
      ...layer,
      selected: selectedLayerIds.includes(layer.id),
    }));
    if (filterTerm) {
      return FilterHelper.filterByTerm(layersWithSelected, filterTerm, l => l.label);
    }
    return layersWithSelected;
  });
  public saveEnabled = computed(() => this.selectedLayers().length > 0);

  public ngOnInit(): void {
    this.layerFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(filterTerm => {
      this.layerFilterSignal.set(filterTerm || '');
    });
  }

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
