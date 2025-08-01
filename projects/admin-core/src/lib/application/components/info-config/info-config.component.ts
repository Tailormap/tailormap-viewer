import { Component, ChangeDetectionStrategy, Input, DestroyRef, signal } from '@angular/core';
import { BaseComponentTypeEnum, InfoComponentConfigModel } from '@tailormap-viewer/api';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, Observable } from 'rxjs';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { ImageUploadResult, TailormapAdminUploadService } from '@tailormap-admin/admin-api';
import { TemplatePicklistConfig } from '@tailormap-viewer/shared';

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
    this.templateContent.set(config?.templateContent);
  }
  public get config() {
    return this._config;
  }
  private _config: InfoComponentConfigModel | undefined;

  public templateContent = signal<string | undefined>('');

  public uploadImage$ = (file: File): Observable<ImageUploadResult | null> => {
    return this.uploadService.uploadImage$(file);
  };

  public templatePicklistConfig = signal<TemplatePicklistConfig | undefined>(undefined);

  public formGroup = new FormGroup({
    openOnStartup: new FormControl<boolean>(false),
  });

  constructor(
    private componentConfigService: ComponentConfigurationService,
    private destroyRef: DestroyRef,
    private uploadService: TailormapAdminUploadService,
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

  public templateChanged($event: string) {
    this.componentConfigService.updateConfigForKey<InfoComponentConfigModel>(this.type, 'templateContent', $event);
  }

}
