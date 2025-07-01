import { ChangeDetectionStrategy, Component, DestroyRef, Input, inject } from '@angular/core';
import {
  BaseComponentTypeEnum, EditConfigModel,
} from '@tailormap-viewer/api';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { ConfigurationComponentModel } from '../configuration-component.model';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'tm-admin-edit-component-config',
  templateUrl: './edit-component-config.component.html',
  styleUrls: ['./edit-component-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EditComponentConfigComponent implements ConfigurationComponentModel<EditConfigModel> {
  private componentConfigService = inject(ComponentConfigurationService);
  private destroyRef = inject(DestroyRef);


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

  public initForm(config: EditConfigModel | undefined) {
    this.formGroup.patchValue({ closeAfterAddFeature: config?.closeAfterAddFeature ?? false }, { emitEvent: false });
  }

  private saveConfig() {
    this.componentConfigService.updateConfigForKey<EditConfigModel>(this.type, 'closeAfterAddFeature', this.formGroup.value.closeAfterAddFeature);
  }

}
