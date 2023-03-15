import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { debounceTime, filter, Subject, takeUntil } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { LayerSettingsModel } from '@tailormap-admin/admin-api';
import { FormHelper } from '../../helpers/form.helper';
import { MatButtonToggleChange } from '@angular/material/button-toggle';

@Component({
  selector: 'tm-admin-layer-settings-form',
  templateUrl: './layer-settings-form.component.html',
  styleUrls: ['./layer-settings-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerSettingsFormComponent implements OnInit {

  private destroyed = new Subject();
  private _layerSettings: LayerSettingsModel | null | undefined;
  private _isLayerSpecific = false;

  @Input()
  public set isLayerSpecific(isLayerSpecific: boolean | undefined) {
    this._isLayerSpecific = !!isLayerSpecific;
    this.patchForm();
  }
  public get isLayerSpecific() {
    return this._isLayerSpecific;
  }

  @Input()
  public set layerSettings(layerSettings: LayerSettingsModel | null | undefined) {
    this._layerSettings = layerSettings;
    this.patchForm();
  }
  public get layerSettings() {
    return this._layerSettings;
  }

  @Output()
  public changed = new EventEmitter<LayerSettingsModel>();

  public layerSettingsForm = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    hiDpiEnabled: new FormControl<boolean | null>(null, { nonNullable: false }),
  });

  constructor() { }

  public ngOnInit(): void {
    this.layerSettingsForm.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        debounceTime(250),
        filter(() => this.isValidForm()),
      )
      .subscribe(value => {
        this.changed.emit(this.getUpdatedLayerSettings(value));
      });
  }

  private getUpdatedLayerSettings(value: Partial<{title: string; hiDpiEnabled: boolean | null}>): LayerSettingsModel {
    const hiDpiDisabled = typeof value === 'undefined' || typeof value.hiDpiEnabled === 'undefined' || value.hiDpiEnabled === null
      ? undefined
      : !value.hiDpiEnabled;

    const settings: LayerSettingsModel = {
      hiDpiDisabled,
    };
    if (this.isLayerSpecific) {
      settings.title = value.title || undefined;
    }
    return settings;
  }

  private isValidForm() {
    if (!this._layerSettings) {
      return this.layerSettingsForm.dirty;
    }
    const values = this.getUpdatedLayerSettings(this.layerSettingsForm.getRawValue());
    return FormHelper.someValuesChanged([
      [ values.title, this._layerSettings.title ],
      [ values.hiDpiDisabled, this._layerSettings.hiDpiDisabled ],
    ]);
  }

  public getHiDPIMode() {
    const mode = this.layerSettingsForm.get('hiDpiEnabled')?.value;
    return typeof mode === 'boolean' ? mode : 'INHERIT';
  }

  public setHiDPIMode($event: MatButtonToggleChange) {
    this.layerSettingsForm.patchValue({
      hiDpiEnabled: typeof $event.value === 'boolean' ? $event.value : null,
    });
  }

  private patchForm() {
    const defaultHiDpiValue = this.isLayerSpecific ? null : true;
    this.layerSettingsForm.patchValue({
      title: this.layerSettings?.title ? this.layerSettings.title : '',
      hiDpiEnabled: this.layerSettings
        ? (typeof this.layerSettings.hiDpiDisabled === 'boolean' ? !this.layerSettings.hiDpiDisabled : defaultHiDpiValue)
        : defaultHiDpiValue,
    }, { emitEvent: false, onlySelf: true });
    this.layerSettingsForm.markAsUntouched();
  }

}
