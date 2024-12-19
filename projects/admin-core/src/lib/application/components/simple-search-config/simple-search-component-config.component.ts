import { ChangeDetectionStrategy, Component, DestroyRef, Input } from '@angular/core';
import { BaseComponentTypeEnum, SimpleSearchConfigModel } from '@tailormap-viewer/api';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { ConfigurationComponentModel } from '../configuration-component.model';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'tm-admin-simple-search-config',
  templateUrl: './simple-search-component-config.component.html',
  styleUrls: ['./simple-search-component-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleSearchComponentConfigComponent implements ConfigurationComponentModel<SimpleSearchConfigModel> {

  @Input()
  public type: BaseComponentTypeEnum | undefined;

  @Input()
  public label: string | undefined;

  @Input()
  public set config(config: SimpleSearchConfigModel | undefined) {
    this._config = config;
    this.initForm(config);
  }
  public get config() {
    return this._config;
  }
  private _config: SimpleSearchConfigModel | undefined;

  public formGroup = new FormGroup({
    municipalities: new FormArray<FormControl<string>>([]),
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

  public get municipalityList() {
    return this.formGroup.get('municipalities') as FormArray<FormControl<string>>;
  }

  public initForm(config: SimpleSearchConfigModel | undefined) {
    const municipalities = config?.municipalities || [];
    const formValues = this.municipalityList.controls.map(c => c.value);
    if (formValues.length === municipalities.length && formValues.every((v, idx) => v === municipalities[idx])) {
      if (this.municipalityList.length === 0) {
        this.addMunicipality();
      }
      return;
    }
    const curValues = new Set((config?.municipalities || []));
    const idxToRemove = this.municipalityList.controls
      .filter(control => !curValues.has(control.value ?? ''))
      .map((_group, idx) => idx);
    idxToRemove.forEach(idx => this.municipalityList.removeAt(idx));
    const newValues = (config?.municipalities || []).filter(v => {
      return !this.municipalityList.controls.some(c => c.value === v);
    });
    newValues.forEach(municipality => {
      this.municipalityList.push(new FormControl<string>(municipality, { nonNullable: true }), { emitEvent: false });
    });
    if (this.municipalityList.length === 0) {
      this.addMunicipality();
    }
  }

  public addMunicipality() {
    this.municipalityList.push(new FormControl<string>('', { nonNullable: true }), { emitEvent: false });
  }

  public deleteMunicipality(idx: number) {
    this.municipalityList.removeAt(idx);
  }

  private saveConfig() {
    this.componentConfigService.updateConfig<SimpleSearchConfigModel>(this.type, 'municipalities', this.formGroup.value.municipalities);
  }

}
