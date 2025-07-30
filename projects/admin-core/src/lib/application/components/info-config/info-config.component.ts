import { Component, ChangeDetectionStrategy, Input, DestroyRef } from '@angular/core';
import { BaseComponentTypeEnum, InfoComponentConfigModel } from '@tailormap-viewer/api';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { ComponentConfigurationService } from '../../services/component-configuration.service';

@Component({
  selector: 'tm-admin-info-config',
  templateUrl: './info-config.component.html',
  styleUrls: ['./info-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class InfoConfigComponent {

  @Input()
  public type: BaseComponentTypeEnum | undefined;

  @Input()
  public label: string | undefined;

  @Input()
  public set config(config: InfoComponentConfigModel | undefined) {
    this._config = config;
    this.initForm(config);
  }
  public get config() {
    return this._config;
  }
  private _config: InfoComponentConfigModel | undefined;

  public formGroup = new FormGroup({
    openOnStartup: new FormControl<boolean>(false),
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

  public initForm(config: InfoComponentConfigModel | undefined) {
    this.formGroup.patchValue({ openOnStartup: config?.openOnStartup ?? false }, { emitEvent: false });
  }

  private saveConfig() {
    this.componentConfigService.updateConfigForKey<InfoComponentConfigModel>(this.type, 'openOnStartup', this.formGroup.value.openOnStartup);
  }

}
