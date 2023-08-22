import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { selectFeatureTypeById } from '../state/catalog.selectors';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { FeatureSourceService } from '../services/feature-source.service';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { FeatureTypeUpdateModel } from '../models/feature-source-update.model';
import { FeatureTypeSettingsModel } from '@tailormap-admin/admin-api';

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

  public save(featureTypeId: string) {
    if (!this.updatedFeatureTypeSubject.value) {
      return;
    }
    const updatedFeatureType = { ...this.updatedFeatureTypeSubject.value };
    this.savingSubject.next(true);
    this.featureSourceService.updateFeatureType$(featureTypeId, updatedFeatureType)
      .subscribe(() => {
        this.savingSubject.next(false);
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
    this.updatedFeatureTypeSubject.next({
      ...this.updatedFeatureTypeSubject.value || {},
      settings: {
        ...settings,
        hideAttributes: Array.from(hideAttributes),
      },
    });
  }

}
