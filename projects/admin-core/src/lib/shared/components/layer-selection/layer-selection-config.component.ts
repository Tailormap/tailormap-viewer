import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, signal, computed, input, output, forwardRef,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { MatSelectionListChange } from '@angular/material/list';
import { Store } from '@ngrx/store';
import { FilterHelper, LoadingStateEnum } from '@tailormap-viewer/shared';
import { loadCatalog } from '../../../catalog/state/catalog.actions';
import { selectCatalogLoadStatus } from '../../../catalog/state/catalog.selectors';
import { selectExtendedAppLayerNodesForSelectedApplication } from '../../../application/state/application.selectors';

@Component({
  selector: 'tm-admin-layer-selection-config-component',
  templateUrl: './layer-selection-config.component.html',
  styleUrls: ['./layer-selection-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LayerSelectionConfigComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class LayerSelectionConfigComponent implements ControlValueAccessor {
  private destroyRef = inject(DestroyRef);
  private store$ = inject(Store);

  public withAttributesOnly = input<boolean>(false);
  public changed = output<string[]>();

  public selectedLayers = signal<string[]>([]);

  public filterControl = new FormControl<string>('');
  public filterTerm = signal<string>('');
  public allLayers = this.store$.selectSignal(selectExtendedAppLayerNodesForSelectedApplication);

  public filteredLayerList = computed(() => {
    const allLayers = this.allLayers();
    const selectedLayerIds = this.selectedLayers();
    const filterTerm = this.filterTerm();
    const withAttributesOnly = this.withAttributesOnly();
    const layersWithSelected = allLayers
      .filter(layer => !withAttributesOnly || layer.featureType?.hasAttributes)
      .map(layer => ({
        ...layer,
        selected: selectedLayerIds.includes(layer.id),
      }));
    if (filterTerm) {
      return FilterHelper.filterByTerm(layersWithSelected, filterTerm, l => l.label);
    }
    return layersWithSelected;
  });

  public disabled = signal(false);
  private onChange: any | null = null;
  private onTouched: any | null = null;

  constructor() {
    this.store$.select(selectCatalogLoadStatus)
      .pipe(take(1))
      .subscribe(loadStatus => {
        if (loadStatus === LoadingStateEnum.INITIAL || loadStatus === LoadingStateEnum.FAILED) {
          this.store$.dispatch(loadCatalog());
        }
      });
    this.filterControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(filterTerm => {
        this.filterTerm.set(filterTerm || '');
      });
  }

  public writeValue(obj: string[] | null): void {
    this.selectedLayers.set(obj || []);
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  public onSelectedLayerChanged($event: MatSelectionListChange) {
    const selectedLayers = [...this.selectedLayers()];
    $event.options.forEach(option => {
      if (option.selected) {
        selectedLayers.push(option.value);
      } else {
        selectedLayers.splice(selectedLayers.indexOf(option.value), 1);
      }
    });
    this.selectedLayers.set(selectedLayers);
    if (this.onChange) {
      this.onChange(selectedLayers);
    }
    if (this.onTouched) {
      this.onTouched();
    }
    this.changed.emit(selectedLayers);
  }

}
