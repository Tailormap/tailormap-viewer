import { ChangeDetectionStrategy, Component, DestroyRef, Input, inject } from '@angular/core';
import {
  BaseComponentTypeEnum, TocConfigModel,
} from '@tailormap-viewer/api';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { ConfigurationComponentModel } from '../configuration-component.model';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'tm-admin-edit-component-config',
  templateUrl: './toc-component-config.component.html',
  styleUrls: ['./toc-component-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TocComponentConfigComponent implements ConfigurationComponentModel<TocConfigModel> {
  private componentConfigService = inject(ComponentConfigurationService);
  private destroyRef = inject(DestroyRef);

  @Input()
  public type: BaseComponentTypeEnum | undefined;

  @Input()
  public label: string | undefined;

  @Input()
  public set config(config: TocConfigModel | undefined) {
    this._config = config;
    this.initForm(config);
  }
  public get config() {
    return this._config;
  }
  private _config: TocConfigModel | undefined;

  public formGroup = new FormGroup({
    showEditLayerIcon: new FormControl<boolean>(false),
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

  public initForm(config: TocConfigModel | undefined) {
    this.formGroup.patchValue({ showEditLayerIcon: config?.showEditLayerIcon ?? false }, { emitEvent: false });
  }

  private saveConfig() {
    this.componentConfigService.updateConfigForKey<TocConfigModel>(this.type, 'showEditLayerIcon', this.formGroup.value.showEditLayerIcon);
  }
}
