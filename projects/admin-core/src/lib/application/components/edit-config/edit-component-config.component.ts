import { ChangeDetectionStrategy, Component, DestroyRef, Input, inject, signal, OnInit, computed, effect } from '@angular/core';
import {
  BaseComponentTypeEnum, EditConfigModel,
} from '@tailormap-viewer/api';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { ConfigurationComponentModel } from '../configuration-component.model';
import { debounceTime, take } from 'rxjs';
import { MatSelectionListChange } from '@angular/material/list';
import { selectExtendedAppLayerNodesForSelectedApplication } from '../../state/application.selectors';
import { Store } from '@ngrx/store';
import { FilterHelper, LoadingStateEnum } from '@tailormap-viewer/shared';
import { selectCatalogLoadStatus } from '../../../catalog/state/catalog.selectors';
import { loadCatalog } from '../../../catalog/state/catalog.actions';

@Component({
  selector: 'tm-admin-edit-component-config',
  templateUrl: './edit-component-config.component.html',
  styleUrls: ['./edit-component-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EditComponentConfigComponent implements ConfigurationComponentModel<EditConfigModel>, OnInit {
  private componentConfigService = inject(ComponentConfigurationService);
  private destroyRef = inject(DestroyRef);
  private store$ = inject(Store);

  @Input()
  public type: BaseComponentTypeEnum | undefined;

  @Input()
  public label: string | undefined;

  @Input()
  public set config(config: EditConfigModel | undefined) {
    this._config = config;
    this.initForm(config);
  }
  public get config() {
    return this._config;
  }
  private _config: EditConfigModel | undefined;

  public formGroup = new FormGroup({
    closeAfterAddFeature: new FormControl<boolean>(false),
  });
  public selectedCopyLayers = signal<string[]>([]);

  // Not in formGroup for config properties, used for layer filter control
  public copyLayerFilter = new FormControl<string>('');
  public copyLayerFilterSignal = signal<string>('');
  public allLayers = this.store$.selectSignal(selectExtendedAppLayerNodesForSelectedApplication);

  public filteredLayerList = computed(() => {
    const allLayers = this.allLayers();
    const selectedLayerIds = this.selectedCopyLayers();
    const filterTerm = this.copyLayerFilterSignal();
    const layersWithSelected = allLayers.map(layer => ({
      ...layer,
      selected: selectedLayerIds.includes(layer.id),
    }));
    if (filterTerm) {
      return FilterHelper.filterByTerm(layersWithSelected, filterTerm, l => l.label);
    }
    return layersWithSelected;
  });

  constructor() {
    this.store$.select(selectCatalogLoadStatus)
      .pipe(take(1))
      .subscribe(loadStatus => {
        if (loadStatus === LoadingStateEnum.INITIAL || loadStatus === LoadingStateEnum.FAILED) {
          this.store$.dispatch(loadCatalog());
        }
      });

    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(250))
      .subscribe(() => {
        if (!this.formGroup.valid) {
          return;
        }
        this.saveConfig();
      });

    effect(() => {
      this.componentConfigService.updateConfigForKey<EditConfigModel>(this.type, 'copyLayerIds', this.selectedCopyLayers());
    });
  }

  public ngOnInit(): void {
    this.copyLayerFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(filterTerm => {
        this.copyLayerFilterSignal.set(filterTerm || '');
      });
  }

  public initForm(config: EditConfigModel | undefined) {
    this.formGroup.patchValue({ closeAfterAddFeature: config?.closeAfterAddFeature ?? false }, { emitEvent: false });
    this.selectedCopyLayers.set(config?.copyLayerIds ?? []);
  }

  private saveConfig() {
    this.componentConfigService.updateConfigForKey<EditConfigModel>(this.type, 'closeAfterAddFeature', this.formGroup.value.closeAfterAddFeature);
  }

  public onCopyLayerSelectionChange($event: MatSelectionListChange) {
    const selectedLayers = [...this.selectedCopyLayers()];
    $event.options.forEach(option => {
      if (option.selected) {
        selectedLayers.push(option.value);
      } else {
        selectedLayers.splice(selectedLayers.indexOf(option.value), 1);
      }
    });
    this.selectedCopyLayers.set(selectedLayers);
  }
}
