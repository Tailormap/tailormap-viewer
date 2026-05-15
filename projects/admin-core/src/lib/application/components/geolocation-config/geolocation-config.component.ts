import { Component, ChangeDetectionStrategy, Input, DestroyRef, inject } from '@angular/core';
import { BaseComponentTypeEnum, GeolocationConfigModel } from '@tailormap-viewer/api';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { ConfigurationComponentModel } from '../configuration-component.model';
import { ComponentConfigurationService } from '../../services/component-configuration.service';

@Component({
  selector: 'tm-admin-geolocation-config',
  templateUrl: './geolocation-config.component.html',
  styleUrls: ['./geolocation-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class GeolocationConfigComponent implements ConfigurationComponentModel<GeolocationConfigModel> {
  private componentConfigService = inject(ComponentConfigurationService);
  private destroyRef = inject(DestroyRef);


  @Input()
  public type: BaseComponentTypeEnum | undefined;

  @Input()
  public label: string | undefined;

  @Input()
  public set config(config: GeolocationConfigModel | undefined) {
    this._config = config;
    this.initForm(config);
  }
  public get config() {
    return this._config;
  }
  private _config: GeolocationConfigModel | undefined;

  public formGroup = new FormGroup({
    noTimeout: new FormControl<boolean>(false),
  });

  constructor() {
    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(250))
      .subscribe(() => {
        if (!this.formGroup.valid) {
          return;
        }
        this.saveConfig();
      });
  }

  public initForm(config: GeolocationConfigModel | undefined) {
    this.formGroup.patchValue({ noTimeout: config?.noTimeout ?? false }, { emitEvent: false });
  }

  private saveConfig() {
    this.componentConfigService.updateConfigForKey<GeolocationConfigModel>(this.type, 'noTimeout', this.formGroup.value.noTimeout);
  }

}
