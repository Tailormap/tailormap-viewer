import { Component, ChangeDetectionStrategy, Input, DestroyRef, inject } from '@angular/core';
import { BaseComponentTypeEnum, DEFAULT_SNAPPING_TOLERANCE, SnappingComponentConfigModel } from '@tailormap-viewer/api';
import { FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { ConfigurationComponentModel } from '../configuration-component.model';

@Component({
  selector: 'tm-admin-snapping-component-config',
  templateUrl: './snapping-component-config.component.html',
  styleUrls: ['./snapping-component-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SnappingComponentConfigComponent implements ConfigurationComponentModel<SnappingComponentConfigModel> {
  private componentConfigService = inject(ComponentConfigurationService);
  private destroyRef = inject(DestroyRef);

  @Input()
  public type: BaseComponentTypeEnum | undefined;

  @Input()
  public label: string | undefined;

  @Input()
  public set config(config: SnappingComponentConfigModel | undefined) {
    this._config = config;
    this.tolerance.patchValue(config?.tolerance || DEFAULT_SNAPPING_TOLERANCE, { emitEvent: false, onlySelf: true });
    this.selectedLayers.patchValue(config?.selectedLayers || [], { emitEvent: false, onlySelf: true });
  }
  public get config() {
    return this._config;
  }
  private _config: SnappingComponentConfigModel | undefined;

  public tolerance = new FormControl<number>(DEFAULT_SNAPPING_TOLERANCE);
  public selectedLayers = new FormControl<string[]>([]);

  constructor() {
    this.tolerance.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tolerance => {
        this.componentConfigService.updateConfigForKey<SnappingComponentConfigModel>(this.type, 'tolerance', tolerance);
      });
    this.selectedLayers.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(selectedLayers => {
        this.componentConfigService.updateConfigForKey<SnappingComponentConfigModel>(this.type, 'selectedLayers', selectedLayers);
      });
  }

}
