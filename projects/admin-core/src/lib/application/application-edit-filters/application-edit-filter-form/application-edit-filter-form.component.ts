import {
  ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, OnInit, Output, signal, WritableSignal,
} from '@angular/core';
import { AttributeFilterModel, AttributeType, FilterConditionEnum, FilterGroupModel, FilterTypeEnum } from '@tailormap-viewer/api';
import { ExtendedGeoServiceLayerModel } from '../../../catalog/models/extended-geo-service-layer.model';
import { AttributeDescriptorModel, FeatureTypeModel } from '@tailormap-admin/admin-api';
import { FormControl, FormGroup } from '@angular/forms';
import { FeatureSourceService } from '../../../catalog/services/feature-source.service';
import { Store } from '@ngrx/store';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter, map, Observable, of, take } from 'rxjs';
import { selectFilterGroups } from '../../state/application.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { nanoid } from 'nanoid';
import { DateTime } from 'luxon';

interface OutputFilterData {
  condition: FilterConditionEnum;
  value: string[];
  caseSensitive?: boolean;
  invertCondition?: boolean;
}

interface InputFilterData {
  condition?: FilterConditionEnum;
  value?: Array<string | DateTime>;
  caseSensitive?: boolean;
  invertCondition?: boolean;
}

@Component({
  selector: 'tm-admin-application-edit-filter-form',
  templateUrl: './application-edit-filter-form.component.html',
  styleUrls: ['./application-edit-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationEditFilterFormComponent implements OnInit {

  private filterGroups$: Observable<FilterGroupModel<AttributeFilterModel>[] | null> = of(null);
  public appLayerIds$: Observable<string[] | null> = of(null);

  public _filterData: InputFilterData = {
    condition: undefined,
    value: undefined,
    caseSensitive: undefined,
    invertCondition: undefined,
  };

  @Input()
  public set filter(attributeFilter: AttributeFilterModel | null) {
    this._filterData = {
      condition: attributeFilter?.condition,
      value: attributeFilter?.value,
      caseSensitive: attributeFilter?.caseSensitive,
      invertCondition: attributeFilter?.invertCondition,
    };
    this.initForm(attributeFilter);
    this.findLayersForFilter(attributeFilter);
    this.setSelectedAttributeForExistingFilter(attributeFilter?.attribute);
  }

  public selectedLayer: WritableSignal<ExtendedGeoServiceLayerModel | null> = signal(null);
  public selectedAttribute: WritableSignal<AttributeDescriptorModel | null> = signal(null);

  private featureTypeSubject$ = new BehaviorSubject<FeatureTypeModel | null>(null);
  public featureType$ = this.featureTypeSubject$.asObservable();

  private loadingFeatureTypeSubject$ = new BehaviorSubject(false);
  public loadingFeatureType$ = this.loadingFeatureTypeSubject$.asObservable();

  @Output()
  public updateFilter = new EventEmitter<FilterGroupModel<AttributeFilterModel>>();

  @Output()
  public validFormChanged = new EventEmitter<boolean>();

  constructor(
    private store$: Store,
    private featureSourceService: FeatureSourceService,
    private destroyRef: DestroyRef,
    ) {
    this.filterGroups$ = this.store$.select(selectFilterGroups);
  }

  public filterForm = new FormGroup({
    id: new FormControl(''),
    layer: new FormControl<{ geoServiceLayer: ExtendedGeoServiceLayerModel | undefined; appLayerId: string } | null>(null),
    attribute: new FormControl(''),
    condition: new FormControl<FilterConditionEnum | null>(null),
    value: new FormControl(['']),
    caseSensitive: new FormControl(false),
    invertCondition: new FormControl(false),
  });

  public ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        map(() => this.isValidForm()),
        distinctUntilChanged(),
      )
      .subscribe(value => {
        this.validFormChanged.emit(value);
      });
    this.filterForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        filter(() => this.isValidForm()),
      )
      .subscribe(value => {
        const attributeFilter: AttributeFilterModel = {
          id: value.id ?? nanoid(),
          attribute: value.attribute ?? '',
          attributeType: this.selectedAttribute()?.type ?? AttributeType.STRING,
          condition: value.condition ?? FilterConditionEnum.NULL_KEY,
          invertCondition: value.invertCondition ?? false,
          caseSensitive: value.caseSensitive ?? false,
          value: value.value ?? [],
          type: FilterTypeEnum.ATTRIBUTE,
        };
        const filterGroup: FilterGroupModel<AttributeFilterModel> = {
          id: '',
          source: "PRESET",
          layerIds: [value.layer?.appLayerId ?? ''],
          type: FilterTypeEnum.ATTRIBUTE,
          filters: [attributeFilter],
          operator: 'AND',
        };
        this.updateFilter.emit(filterGroup);
      });
  }

  private initForm(attributeFilter: AttributeFilterModel | null) {
    if (!attributeFilter) {
      this.filterForm.patchValue({
        id: nanoid(),
        layer: null,
        attribute: '',
        condition: null,
        value: [],
        caseSensitive: false,
        invertCondition: false,
      }, { emitEvent: false });
    } else {
      this.filterForm.patchValue({
        id: attributeFilter.id,
        attribute: attributeFilter.attribute,
        condition: attributeFilter.condition,
        value: attributeFilter.value,
        caseSensitive: attributeFilter.caseSensitive,
        invertCondition: attributeFilter.invertCondition,
      }, { emitEvent: false });
    }
  }

  private isValidForm(): boolean {
    return true;
  }

  public setSelectedLayer($event: { geoServiceLayer: ExtendedGeoServiceLayerModel | undefined; appLayerId: string }) {
    this.selectedLayer.set($event.geoServiceLayer ?? null);

    this.filterForm.patchValue({
      layer: $event,
    }, { emitEvent: true });

    this.loadingFeatureTypeSubject$.next(true);
    if ($event.geoServiceLayer?.layerSettings?.featureType) {
      this.featureSourceService.loadFeatureType$(
        $event.geoServiceLayer?.layerSettings?.featureType?.featureTypeName,
        `${$event.geoServiceLayer?.layerSettings?.featureType?.featureSourceId}`,
      )
        .pipe(take(1))
        .subscribe(featureType => {
          this.featureTypeSubject$.next(featureType);
          this.loadingFeatureTypeSubject$.next(false);
        });
    }

  }

  public setSelectedAttribute($event: AttributeDescriptorModel) {
    this.selectedAttribute.set($event);
    this.filterForm.patchValue({
      attribute: $event.name,
    }, { emitEvent: true });
  }

  public setFilterValues($event: OutputFilterData) {
    this.filterForm.patchValue({
      condition: $event.condition,
      value: $event.value,
      caseSensitive: $event.caseSensitive,
      invertCondition: $event.invertCondition,
    }, { emitEvent: true });
  }

  private findLayersForFilter(attributeFilter: AttributeFilterModel | null) {
    if (!attributeFilter) {
      return;
    }
    this.appLayerIds$ = this.filterGroups$.pipe(
      map(filterGroups => {
        if (!filterGroups) {
          return null;
        }
        return filterGroups.find(filterGroup => {
          for (const filterInGroup of filterGroup.filters) {
            if (filterInGroup.id === attributeFilter.id) {
              return true;
            }
          }
          return false;
        })?.layerIds ?? null;
      }),
      distinctUntilChanged(),
    )
  }

  private setSelectedAttributeForExistingFilter(attributeName: string | undefined) {
    if (!attributeName) {
      return;
    }
    this.featureType$.subscribe(featureType => {
      const selectedAttribute = featureType?.attributes.find(attribute => attribute?.name === attributeName);
      if (selectedAttribute) {
        this.setSelectedAttribute(selectedAttribute);
      }
    })
  }

}
