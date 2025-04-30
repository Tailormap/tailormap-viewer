import { Component, ChangeDetectionStrategy, Input, WritableSignal, signal, Output, EventEmitter, Signal } from '@angular/core';
import { AttributeFilterModel, FilterConditionEnum, FilterGroupModel } from '@tailormap-viewer/api';
import { ExtendedGeoServiceLayerModel } from '../../../catalog/models/extended-geo-service-layer.model';
import { AttributeDescriptorModel, FeatureTypeModel } from '@tailormap-admin/admin-api';
import { FormControl, FormGroup } from '@angular/forms';
import { FeatureSourceService } from '../../../catalog/services/feature-source.service';
import { Store } from '@ngrx/store';
import { BehaviorSubject, take } from 'rxjs';
import { selectFilterGroups } from '../../state/application.selectors';

@Component({
  selector: 'tm-admin-application-edit-filter-form',
  templateUrl: './application-edit-filter-form.component.html',
  styleUrls: ['./application-edit-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationEditFilterFormComponent {


  @Input()
  public set filter(filter: AttributeFilterModel | null) {
    this.initForm(filter);
  }

  public selectedLayer: WritableSignal<ExtendedGeoServiceLayerModel | null> = signal(null);
  public selectedAttribute: WritableSignal<AttributeDescriptorModel | null> = signal(null);

  public conditionOptions = Object.values(FilterConditionEnum).filter(value => !value.includes("KEY"));

  private featureTypeSubject$ = new BehaviorSubject<FeatureTypeModel | null>(null);
  public featureType$ = this.featureTypeSubject$.asObservable();

  private loadingFeatureTypeSubject$ = new BehaviorSubject(false);
  public loadingFeatureType$ = this.loadingFeatureTypeSubject$.asObservable();

  private filterGroups: Signal<FilterGroupModel<AttributeFilterModel>[]> = this.store$.selectSignal(selectFilterGroups);

  @Output()
  public updateFilter = new EventEmitter<AttributeFilterModel>();

  @Output()
  public validFormChanged = new EventEmitter<boolean>();



  constructor(
    private store$: Store,
    private featureSourceService: FeatureSourceService,
    ) { }

  public filterForm = new FormGroup({
    attribute: new FormControl(''),
    condition: new FormControl<FilterConditionEnum | null>(null),
    value: new FormControl(''),
  });

  public setSelectedLayer($event: ExtendedGeoServiceLayerModel) {
    this.selectedLayer.set($event);

    this.loadingFeatureTypeSubject$.next(true);
    if ($event.layerSettings?.featureType) {
      this.featureSourceService.loadFeatureType$(
        $event.layerSettings?.featureType?.featureTypeName,
        `${$event.layerSettings?.featureType?.featureSourceId}`,
      )
        .pipe(take(1))
        .subscribe(featureType => {
          this.featureTypeSubject$.next(featureType);
          this.loadingFeatureTypeSubject$.next(false);
        });
    }

  }

  private initForm(filter: AttributeFilterModel | null) {
    if (!filter) {
      this.filterForm.patchValue({
        attribute: '',
        condition: null,
        value: '',
      }, { emitEvent: false });
    } else {
      this.filterForm.patchValue({
        attribute: filter.attribute,
        condition: filter.condition,
        value: filter.value[0],
      }, { emitEvent: false });
    }
  }

  private isValidForm(): boolean {
    return true;
  }

  public setSelectedAttribute($event: AttributeDescriptorModel) {
    console.log("setSelectedAttribute: ", $event);
    this.selectedAttribute.set($event);
  }
}
