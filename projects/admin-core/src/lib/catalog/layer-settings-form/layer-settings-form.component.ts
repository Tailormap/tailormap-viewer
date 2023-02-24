import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { debounceTime, filter, Subject, takeUntil } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { LayerSettingsModel } from '@tailormap-admin/admin-api';
import { FormHelper } from '../../helpers/form.helper';

@Component({
  selector: 'tm-admin-layer-settings-form',
  templateUrl: './layer-settings-form.component.html',
  styleUrls: ['./layer-settings-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerSettingsFormComponent implements OnInit {

  private destroyed = new Subject();
  private _layerSettings: LayerSettingsModel | null = null;

  @Input()
  public showTitle = true;

  @Input()
  public set layerSettings(layerSettings: LayerSettingsModel | null) {
    this.layerSettingsForm.patchValue({
      title: layerSettings ? layerSettings.title : '',
      hiDpiEnabled: layerSettings ? !layerSettings.hiDpiDisabled : true,
    });
    this._layerSettings = layerSettings;
  }

  public get layerSettings(): LayerSettingsModel | null {
    return this._layerSettings;
  }

  @Output()
  public changed = new EventEmitter<LayerSettingsModel>();

  public layerSettingsForm = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    hiDpiEnabled: new FormControl<boolean>(true, { nonNullable: true }),
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
        this.changed.emit({
          title: value.title || '',
          hiDpiDisabled: typeof value === 'undefined' || typeof value.hiDpiEnabled === 'undefined'
            ? true
            : !value.hiDpiEnabled,
        });
      });
  }

  private isValidForm() {
    const values = this.layerSettingsForm.getRawValue();
    return FormHelper.isValidValue(values.title)
      && this.layerSettingsForm.dirty;
  }

}
