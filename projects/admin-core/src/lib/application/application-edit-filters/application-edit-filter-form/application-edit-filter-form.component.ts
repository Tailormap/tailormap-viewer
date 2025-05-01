import {
  ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, OnInit, Output, signal, Signal, WritableSignal,
} from '@angular/core';
import { AttributeFilterModel, AttributeType, FilterConditionEnum, FilterGroupModel, FilterTypeEnum } from '@tailormap-viewer/api';
import { ExtendedGeoServiceLayerModel } from '../../../catalog/models/extended-geo-service-layer.model';
import { AttributeDescriptorModel, FeatureTypeModel } from '@tailormap-admin/admin-api';
import { FormControl, FormGroup } from '@angular/forms';
import { FeatureSourceService } from '../../../catalog/services/feature-source.service';
import { Store } from '@ngrx/store';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter, map, take } from 'rxjs';
import { selectFilterGroups } from '../../state/application.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { nanoid } from 'nanoid';

interface OutputFilterData {
  condition: FilterConditionEnum;
  value: string[];
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


  @Input()
  public set filter(attributeFilter: AttributeFilterModel | null) {
    this.initForm(attributeFilter);
  }

  public selectedLayer: WritableSignal<ExtendedGeoServiceLayerModel | null> = signal(null);
  public selectedAttribute: WritableSignal<AttributeDescriptorModel | null> = signal(null);

  private featureTypeSubject$ = new BehaviorSubject<FeatureTypeModel | null>(null);
  public featureType$ = this.featureTypeSubject$.asObservable();

  private loadingFeatureTypeSubject$ = new BehaviorSubject(false);
  public loadingFeatureType$ = this.loadingFeatureTypeSubject$.asObservable();

  private filterGroups: Signal<FilterGroupModel<AttributeFilterModel>[]> = this.store$.selectSignal(selectFilterGroups);

  @Output()
  public updateFilter = new EventEmitter<FilterGroupModel<AttributeFilterModel>>();

  @Output()
  public validFormChanged = new EventEmitter<boolean>();

  constructor(
    private store$: Store,
    private featureSourceService: FeatureSourceService,
    private destroyRef: DestroyRef,
    ) { }

  public filterForm = new FormGroup({
    layer: new FormControl<{geoServiceLayer: ExtendedGeoServiceLayerModel | undefined; appLayerId: string } | null>(null),
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
        console.log("value change");
        const attributeFilter: AttributeFilterModel = {
          id: nanoid(),
          attribute: value.attribute ?? '',
          attributeType: this.selectedAttribute()?.type ?? AttributeType.STRING,
          condition: value.condition ?? FilterConditionEnum.NULL_KEY,
          invertCondition: value.invertCondition ?? false,
          caseSensitive: value.caseSensitive ?? false,
          value: value.value ?? [],
          type: FilterTypeEnum.ATTRIBUTE,
        };
        const filterGroup: FilterGroupModel<AttributeFilterModel> = {
          id: nanoid(),
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
        layer: null,
        attribute: '',
        condition: null,
        value: [],
      }, { emitEvent: false });
    } else {
      this.filterForm.patchValue({
        attribute: attributeFilter.attribute,
        condition: attributeFilter.condition,
        value: attributeFilter.value,
      }, { emitEvent: false });
    }
  }

  private isValidForm(): boolean {
    return true;
  }

  public setSelectedLayer($event: {geoServiceLayer: ExtendedGeoServiceLayerModel | undefined; appLayerId: string }) {
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
}
