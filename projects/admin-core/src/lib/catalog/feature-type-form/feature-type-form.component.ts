import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { FeatureSourceService } from '../services/feature-source.service';
import { FeatureTypeUpdateModel } from '../models/feature-source-update.model';
import { AttributeSettingsModel, FeatureTypeSettingsModel } from '@tailormap-admin/admin-api';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';

@Component({
  selector: 'tm-admin-feature-type-form',
  templateUrl: './feature-type-form.component.html',
  styleUrls: ['./feature-type-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureTypeFormComponent {

  @Input()
  public set featureType(featureType: ExtendedFeatureTypeModel | null) {
    this._featureType = featureType;
    this.initFeatureTypeSettings(featureType);
  }
  public get featureType() {
    return this._featureType;
  }

  @Input()
  public dialogLayout: boolean = false;

  @Output()
  public featureTypeUpdated = new EventEmitter<ExtendedFeatureTypeModel | null>;

  @Output()
  public cancel = new EventEmitter();

  private _featureType: ExtendedFeatureTypeModel | null = null;

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();
  public saveEnabled = false;

  private updatedFeatureTypeSubject = new BehaviorSubject<FeatureTypeUpdateModel | null>(null);

  public featureTypeSettings$: Observable<FeatureTypeSettingsModel> = of({});

  constructor(
    private featureSourceService: FeatureSourceService,
  ) { }

  public initFeatureTypeSettings(featureType: ExtendedFeatureTypeModel | null) {
    if (featureType) {
      this.updatedFeatureTypeSubject.next(null);
    }
    this.featureTypeSettings$ = this.updatedFeatureTypeSubject.asObservable()
      .pipe(map((updatedFeatureType): FeatureTypeSettingsModel => {
        return { ...(featureType?.settings || {}), ...(updatedFeatureType?.settings || {}) };
      }));
  }

  public save(featureType: ExtendedFeatureTypeModel) {
    if (!this.updatedFeatureTypeSubject.value) {
      return;
    }
    const currentUpdatedValue = this.updatedFeatureTypeSubject.value;
    const updatedFeatureType: FeatureTypeUpdateModel = {
      ...currentUpdatedValue,
      settings: {
        attributeSettings: currentUpdatedValue?.settings?.attributeSettings || featureType.settings.attributeSettings || {},
        hideAttributes: currentUpdatedValue?.settings?.hideAttributes || featureType.settings.hideAttributes || [],
        attributeOrder: currentUpdatedValue?.settings?.attributeOrder || featureType.settings.attributeOrder || [],
      },
    };
    this.savingSubject.next(true);
    this.featureSourceService.updateFeatureType$(featureType.id, updatedFeatureType)
      .subscribe(result => {
        this.savingSubject.next(false);
        if (result) {
          this.saveEnabled = false;
        }
        this.featureTypeUpdated.emit(result);
      });
  }

  public closeDialog() {
    this.cancel.emit();
  }

  public attributeEnabledChanged(
    originalSettings: FeatureTypeSettingsModel,
    $event: Array<{ attribute: string; enabled: boolean }>,
  ) {
    const settings = this.updatedFeatureTypeSubject.value?.settings || {};
    const hideAttributes = new Set(settings?.hideAttributes || originalSettings.hideAttributes || []);
    $event.forEach(change => {
      if (change.enabled) {
        hideAttributes.delete(change.attribute);
      } else {
        hideAttributes.add(change.attribute);
      }
    });
    this.updateSettings('hideAttributes', Array.from(hideAttributes));
  }

  public attributeOrderChanged(attributes: string[]) {
    this.updateSettings('attributeOrder', attributes);
  }

  public aliasesChanged(
    originalSettings: FeatureTypeSettingsModel,
    aliases: Array<{ attribute: string; alias: string | undefined }>,
  ) {
    const settings = this.updatedFeatureTypeSubject.value?.settings || {};
    const attributeSettings: Record<string, AttributeSettingsModel> = { ...(settings?.attributeSettings || originalSettings.attributeSettings || {}) };
    aliases.forEach(alias => {
      attributeSettings[alias.attribute] = {
        ...attributeSettings[alias.attribute],
        title: alias.alias,
      };
    });
    this.updateSettings('attributeSettings', attributeSettings);
  }

  private updateSettings(type: keyof FeatureTypeSettingsModel, value: any) {
    const settings = this.updatedFeatureTypeSubject.value?.settings || {};
    this.updatedFeatureTypeSubject.next({
      ...this.updatedFeatureTypeSubject.value || {},
      settings: { ...settings, [type]: value },
    });
    this.saveEnabled = true;
  }

}
