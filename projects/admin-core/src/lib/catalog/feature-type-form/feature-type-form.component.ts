import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, inject } from '@angular/core';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { FeatureSourceService } from '../services/feature-source.service';
import { FeatureTypeUpdateModel } from '../models/feature-source-update.model';
import { AttributeSettingsModel, FeatureTypeModel, FeatureTypeSettingsModel, FeatureTypeTemplateModel } from '@tailormap-admin/admin-api';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';
import { Store } from '@ngrx/store';
import { selectFeatureSourceByFeatureTypeOriginalId } from '../state/catalog.selectors';

@Component({
  selector: 'tm-admin-feature-type-form',
  templateUrl: './feature-type-form.component.html',
  styleUrls: ['./feature-type-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FeatureTypeFormComponent {
  private featureSourceService = inject(FeatureSourceService);
  private store$ = inject(Store);


  @Input()
  public set featureType(featureType: FeatureTypeModel | null) {
    this._featureType = featureType;
    this.initFeatureTypeSettings(featureType);
  }
  public get featureType() {
    return this._featureType;
  }

  @Input()
  public dialogLayout: boolean = false;

  @Output()
  public featureTypeUpdated = new EventEmitter<FeatureTypeModel | null>;

  @Output()
  public cancelled = new EventEmitter();

  private _featureType: FeatureTypeModel | null = null;

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();
  public saveEnabled = false;

  private updatedFeatureTypeSubject = new BehaviorSubject<FeatureTypeUpdateModel | null>(null);

  public featureTypeSettings$: Observable<FeatureTypeSettingsModel> = of({});

  public featureSource$: Observable<ExtendedFeatureSourceModel | undefined> = of(undefined);

  public initFeatureTypeSettings(featureType: FeatureTypeModel | null) {
    if (featureType) {
      this.updatedFeatureTypeSubject.next(null);
    }
    this.featureTypeSettings$ = this.updatedFeatureTypeSubject.asObservable()
      .pipe(map((updatedFeatureType): FeatureTypeSettingsModel => {
        return { ...(featureType?.settings || {}), ...(updatedFeatureType?.settings || {}) };
      }));
    this.featureSource$ = featureType
      ? this.store$.select(selectFeatureSourceByFeatureTypeOriginalId(featureType.id))
      : of(undefined);
  }

  public save(featureType: FeatureTypeModel) {
    if (!this.updatedFeatureTypeSubject.value) {
      return;
    }
    const currentUpdatedValue = this.updatedFeatureTypeSubject.value;
    const updatedFeatureType: FeatureTypeUpdateModel = {
      ...currentUpdatedValue,
      settings: {
        attributeSettings: currentUpdatedValue?.settings?.attributeSettings || featureType.settings.attributeSettings || {},
        hideAttributes: currentUpdatedValue?.settings?.hideAttributes || featureType.settings.hideAttributes || [],
        readOnlyAttributes: currentUpdatedValue?.settings?.readOnlyAttributes || featureType.settings.readOnlyAttributes || [],
        attributeOrder: currentUpdatedValue?.settings?.attributeOrder || featureType.settings.attributeOrder || [],
        template: currentUpdatedValue?.settings?.template || featureType.settings.template || undefined,
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
    this.cancelled.emit();
  }

  public attributeEnabledChanged(
    originalSettings: FeatureTypeSettingsModel,
    $event: Array<{ attribute: string; checked: boolean }>,
  ) {
    this.updateAttributeChecked('hideAttributes', originalSettings, $event);
  }

  public attributeReadonlyChanged(
    originalSettings: FeatureTypeSettingsModel,
    $event: Array<{ attribute: string; checked: boolean }>,
  ) {
    this.updateAttributeChecked('readOnlyAttributes', originalSettings, $event);
  }

  private updateAttributeChecked(
    type: 'readOnlyAttributes' | 'hideAttributes',
    originalSettings: FeatureTypeSettingsModel,
    $event: Array<{ attribute: string; checked: boolean }>,
  ) {
    const settings = this.updatedFeatureTypeSubject.value?.settings || {};
    const attributes = new Set(settings[type] || originalSettings[type] || []);
    $event.forEach(change => {
      if (change.checked) {
        attributes.delete(change.attribute);
      } else {
        attributes.add(change.attribute);
      }
    });
    this.updateSettings(type, Array.from(attributes));
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

  public templateUpdated($event: FeatureTypeTemplateModel) {
    this.updateSettings('template', $event);
  }

}
