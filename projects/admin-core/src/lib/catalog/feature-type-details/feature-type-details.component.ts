import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { selectFeatureTypeById } from '../state/catalog.selectors';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { FeatureSourceService } from '../services/feature-source.service';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { FeatureTypeUpdateModel } from '../models/feature-source-update.model';
import { AttributeSettingsModel, FeatureTypeModel, FeatureTypeSettingsModel } from '@tailormap-admin/admin-api';
import { ObjectHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-admin-feature-type-details',
  templateUrl: './feature-type-details.component.html',
  styleUrls: ['./feature-type-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureTypeDetailsComponent implements OnInit, OnDestroy {

  public featureType$: Observable<ExtendedFeatureTypeModel | null> = of(null);
  private destroyed = new Subject();

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();
  public saveEnabled = false;

  public updatedFeatureTypeSubject = new BehaviorSubject<FeatureTypeUpdateModel | null>(null);
  public updatedFeatureType$ = this.updatedFeatureTypeSubject.asObservable();
  public featureTypeSettings$: Observable<FeatureTypeSettingsModel> = of({});

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private featureSourceService: FeatureSourceService,
  ) { }

  public ngOnInit(): void {
    this.featureType$ = this.route.paramMap.pipe(
      distinctUntilChanged((prev: ParamMap, curr: ParamMap) => {
        return prev.get('featureSourceId') === curr.get('featureSourceId') && prev.get('featureTypeId') === curr.get('featureTypeId');
      }),
      map(params => ({ featureSourceId: params.get('featureSourceId'), featureTypeId: params.get('featureTypeId') })),
      switchMap(({ featureSourceId, featureTypeId }) => {
        if (typeof featureSourceId !== 'string' || typeof featureTypeId !== 'string') {
          return of(null);
        }
        return this.store$.select(selectFeatureTypeById(featureTypeId));
      }),
      tap(featureType => { if (featureType) { this.updatedFeatureTypeSubject.next(null); }}),
    );
    this.featureTypeSettings$ = combineLatest([
      this.featureType$,
      this.updatedFeatureType$,
    ]).pipe(map(([ featureType, updatedFeatureType ]): FeatureTypeSettingsModel => {
      return { ...(featureType?.settings || {}), ...(updatedFeatureType?.settings || {}) };
    }));
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
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
      });
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
