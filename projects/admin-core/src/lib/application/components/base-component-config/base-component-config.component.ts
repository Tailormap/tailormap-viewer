import { Component, ChangeDetectionStrategy, Input, DestroyRef } from '@angular/core';
import {
  BaseComponentConfigHelper, BaseComponentTypeEnum, ComponentBaseConfigModel, MeasureComponentConfigModel,
} from '@tailormap-viewer/api';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfigurationComponentModel } from '../configuration-component.model';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatLabel } from '@angular/material/select';

@Component({
  selector: 'tm-admin-base-component-config',
  templateUrl: './base-component-config.component.html',
  styleUrls: ['./base-component-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCheckbox,
    MatFormField,
    MatInput,
    MatLabel,
  ],
})
export class BaseComponentConfigComponent implements ConfigurationComponentModel {

  @Input()
  public type: BaseComponentTypeEnum | undefined;

  @Input()
  public label: string | undefined;

  @Input()
  public titleLabel: string | undefined;

  @Input()
  public set config(config: ComponentBaseConfigModel | undefined) {
    this._config = config;
    this.formGroup.patchValue({
      title: config?.title || '',
    }, { emitEvent: false, onlySelf: true });
  }
  public get config() {
    return this._config;
  }
  public _config: ComponentBaseConfigModel | undefined = undefined;

  public formGroup = new FormGroup({
    title: new FormControl<string>(''),
  });

  public constructor(
    private componentConfigService: ComponentConfigurationService,
    private destroyRef: DestroyRef,
  ) {
    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(values => {
        this.updateConfig('title', values.title);
      });
  }

  public getEnabled() {
    if (!this.config) {
      return !BaseComponentConfigHelper.isComponentDisabledByDefault(this.type || '');
    }
    return this.config.enabled;
  }

  public toggleEnabled() {
    this.updateConfig('enabled', !this.getEnabled());
  }

  private updateConfig(key: keyof ComponentBaseConfigModel, value: string | number | boolean | undefined | null) {
    this.componentConfigService.updateConfigForKey<ComponentBaseConfigModel>(this.type, key, value);
  }

}
