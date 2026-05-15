import { Component, ChangeDetectionStrategy, Input, DestroyRef, inject } from '@angular/core';
import { BaseComponentTypeEnum, DrawingComponentConfigModel } from '@tailormap-viewer/api';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { ComponentConfigurationService } from '../../services/component-configuration.service';

@Component({
  selector: 'tm-admin-drawing-config',
  templateUrl: './drawing-config.component.html',
  styleUrls: ['./drawing-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DrawingConfigComponent {

  private componentConfigService = inject(ComponentConfigurationService);
  private destroyRef = inject(DestroyRef);

  @Input()
  public type: BaseComponentTypeEnum | undefined;

  @Input()
  public label: string | undefined;

  @Input()
  public set config(config: DrawingComponentConfigModel | undefined) {
    this._config = config;
    this.initForm(config);
  }
  public get config() {
    return this._config;
  }
  private _config: DrawingComponentConfigModel | undefined;

  public formGroup = new FormGroup({
    openOnStartup: new FormControl<boolean>(false),
  });

  constructor() {
    this.formGroup.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
      )
      .subscribe(() => {
        if (!this.formGroup.valid) {
          return;
        }
        this.saveConfig();
      });
  }

  public initForm(config: DrawingComponentConfigModel | undefined) {
    this.formGroup.patchValue({ openOnStartup: config?.openOnStartup ?? false }, { emitEvent: false });
  }

  private saveConfig() {
    this.componentConfigService.updateConfigForKey<DrawingComponentConfigModel>(this.type, 'openOnStartup', this.formGroup.value.openOnStartup);
  }

}
