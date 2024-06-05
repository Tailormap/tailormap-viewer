import { ChangeDetectionStrategy, Component, DestroyRef, Input } from '@angular/core';
import { BaseComponentTypeEnum, CoordinateLinkWindowConfigModel, CoordinateLinkWindowConfigUrlModel } from '@tailormap-viewer/api';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { ConfigurationComponentModel } from '../configuration-component.model';
import { ProjectionCodesEnum } from '@tailormap-viewer/map';
import { debounceTime } from 'rxjs';
import { AdminProjectionsHelper } from '../../helpers/admin-projections-helper';
import { nanoid } from 'nanoid';


type UrlFormType = FormGroup<{
  id: FormControl<string>;
  url: FormControl<string>;
  alias: FormControl<string>;
  projection: FormControl<ProjectionCodesEnum>;
}>;

@Component({
  selector: 'tm-admin-coordinate-link-window-config',
  templateUrl: './coordinate-link-window-component-config.component.html',
  styleUrls: ['./coordinate-link-window-component-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinateLinkWindowComponentConfigComponent implements ConfigurationComponentModel<CoordinateLinkWindowConfigModel> {

  @Input()
  public type: BaseComponentTypeEnum | undefined;

  @Input()
  public label: string | undefined;

  @Input()
  public set config(config: CoordinateLinkWindowConfigModel | undefined) {
    this._config = config;
    this.initForm(config);
  }
  public get config() {
    return this._config;
  }
  private _config: CoordinateLinkWindowConfigModel | undefined;

  public formGroup = new FormGroup({
    urls: new FormArray<UrlFormType>([]),
  });

  public get urlList() {
    return this.formGroup.get('urls') as FormArray<UrlFormType>;
  }

  public projections = AdminProjectionsHelper.projections;

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

  public initForm(config: CoordinateLinkWindowConfigModel | undefined) {
    const curIds = new Set((config?.urls || []).map(u => u.id));
    const existingFormIds = new Set(this.urlList.controls.map(group => group.value.id ?? ''));
    const idxToRemove = this.urlList.controls
      .filter(group => !curIds.has(group.value.id ?? ''))
      .map((_group, idx) => idx);
    idxToRemove.forEach(idx => this.urlList.removeAt(idx));
    config?.urls.forEach(url => {
      if (existingFormIds.has(url.id)) {
        this.urlList.controls.find(u => u.value.id === url.id)?.patchValue({
          id: url.id,
          url: url.url,
          alias: url.alias,
          projection: url.projection,
        }, { emitEvent: false });
      } else {
        this.urlList.push(this.createForm(url), { emitEvent: false });
      }
    });
    if (this.urlList.length === 0) {
      this.addUrl();
    }
  }

  public addUrl() {
    this.urlList.push(this.createForm());
    this.saveConfig();
  }

  public deleteUrl(urlIndex: number) {
    this.urlList.removeAt(urlIndex);
    this.saveConfig();
  }

  private saveConfig() {
    const values = this.formGroup.value;
    const urls: CoordinateLinkWindowConfigUrlModel[] = (values.urls || [])
      .map<CoordinateLinkWindowConfigUrlModel>(u => {
        return {
          id: u.id ?? nanoid(),
          url: u.url ?? '',
          alias: u.alias ?? '',
          projection: u.projection ?? ProjectionCodesEnum.RD,
        };
      });
    this.componentConfigService.updateConfig<CoordinateLinkWindowConfigModel>(this.type, 'urls', urls);
  }

  private createForm(url?: CoordinateLinkWindowConfigUrlModel): UrlFormType {
    return new FormGroup({
      id: new FormControl<string>(url?.id || nanoid(), { nonNullable: true }),
      url: new FormControl<string>(url ? url.url : '', { nonNullable: true }),
      alias: new FormControl<string>(url ? url.alias : '', { nonNullable: true }),
      projection: new FormControl<ProjectionCodesEnum>(url ? url.projection : ProjectionCodesEnum.RD, { nonNullable: true }),
    });
  }

}
