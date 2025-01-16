import { ChangeDetectionStrategy, Component, DestroyRef, Input } from '@angular/core';
import {
  BaseComponentTypeEnum, FeatureInfoConfigModel,
} from '@tailormap-viewer/api';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { ConfigurationComponentModel } from '../configuration-component.model';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'tm-admin-coordinate-link-window-config',
  templateUrl: './feature-info-component-config.component.html',
  styleUrls: ['./feature-info-component-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FeatureInfoComponentConfigComponent implements ConfigurationComponentModel<FeatureInfoConfigModel> {

  @Input()
  public type: BaseComponentTypeEnum | undefined;

  @Input()
  public label: string | undefined;

  @Input()
  public set config(config: FeatureInfoConfigModel | undefined) {
    this._config = config;
    this.initForm(config);
  }
  public get config() {
    return this._config;
  }
  private _config: FeatureInfoConfigModel | undefined;

  public formGroup = new FormGroup({
    defaultShowDropdown: new FormControl<boolean>(false),
  });

  constructor(
    private componentConfigService: ComponentConfigurationService,
    private destroyRef: DestroyRef,
  ) {
    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(250))
      .subscribe(() => {
        if (!this.formGroup.valid) {
          return;
        }
        this.saveConfig();
      });
  }

  public initForm(config: FeatureInfoConfigModel | undefined) {
    this.formGroup.patchValue({ defaultShowDropdown: config?.defaultShowDropdown ?? false }, { emitEvent: false });
  }

  private saveConfig() {
    this.componentConfigService.updateConfig<FeatureInfoConfigModel>(this.type, 'defaultShowDropdown', this.formGroup.value.defaultShowDropdown);
  }

}
