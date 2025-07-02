import {
  Component, ChangeDetectionStrategy, Signal, computed, OnDestroy, OnInit, DestroyRef, signal,
} from '@angular/core';
import { GeoServiceLayerInApplicationModel } from '../../models/geo-service-layer-in-application.model';
import { Store } from '@ngrx/store';
import { selectApplicationSelectedFilterLayerId, selectFilterableLayersForApplication } from '../../state/application.selectors';
import { setApplicationSelectedFilterLayerId } from '../../state/application.actions';
import { FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FilterHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-admin-filterable-layers-list',
  templateUrl: './application-filterable-layers-list.component.html',
  styleUrls: ['./application-filterable-layers-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationFilterableLayersListComponent implements OnDestroy, OnInit {

  public filterableLayers: Signal<GeoServiceLayerInApplicationModel[]> = this.store$.selectSignal(selectFilterableLayersForApplication);
  public selectedLayerId: Signal<string | undefined> = this.store$.selectSignal(selectApplicationSelectedFilterLayerId);

  public layerFilter = new FormControl<string>('');
  public layerFilterSignal = signal<string>('');

  public filterableLayersWithSelected = computed(() => {
    const filterableLayers = this.filterableLayers();
    const selectedLayerId = this.selectedLayerId();
    const filterTerm = this.layerFilterSignal();
    const layersWithSelected = filterableLayers.map(layer => {
      return {
        ...layer,
        isSelected: layer.appLayerId === selectedLayerId,
      };
    });
    if (filterTerm) {
      return FilterHelper.filterByTerm(layersWithSelected, filterTerm, l => l.geoServiceLayer.title);
    }
    return layersWithSelected;
  });

  constructor(
    private store$: Store,
    private destroyRef: DestroyRef,
    ) { }

  public setSelectedLayer(layer: GeoServiceLayerInApplicationModel) {
    if (!layer) {
      return;
    }
    this.store$.dispatch(setApplicationSelectedFilterLayerId({ filterLayerId: layer.appLayerId }));
  }

  public ngOnDestroy(): void {
    this.store$.dispatch(setApplicationSelectedFilterLayerId({ filterLayerId: undefined }));
  }

  public ngOnInit(): void {
    this.layerFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(filterTerm => {
        if (filterTerm !== null) {
          this.layerFilterSignal.set(filterTerm);
        }
      });
  }

}
