import { Component, ChangeDetectionStrategy, Signal, OnDestroy } from '@angular/core';
import { AttributeFilterModel, FilterConditionEnum, FilterGroupModel } from '@tailormap-viewer/api';
import {
  selectFilterGroups, selectFiltersForApplication, selectSelectedApplicationId, selectSelectedLayerForApplication,
} from '../../state/application.selectors';
import { Store } from '@ngrx/store';
import { GeoServiceLayerInApplicationModel } from '../../models/geo-service-layer-in-application.model';
import { setApplicationSelectedFilterId } from '../../state/application.actions';
import { AttributeFilterHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-admin-application-filters-list',
  templateUrl: './application-filters-list.component.html',
  styleUrls: ['./application-filters-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationFiltersListComponent implements OnDestroy {

  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);
  public filterGroups: Signal<FilterGroupModel<AttributeFilterModel>[]> = this.store$.selectSignal(selectFilterGroups);
  public selectedLayer: Signal<GeoServiceLayerInApplicationModel | undefined> = this.store$.selectSignal(selectSelectedLayerForApplication);
  public filters: Signal<{filter: AttributeFilterModel; selected: boolean}[]> = this.store$.selectSignal(selectFiltersForApplication);

  constructor(private store$: Store) {}

  public ngOnDestroy(): void {
    this.store$.dispatch(setApplicationSelectedFilterId({ filterId: undefined }));
  }

  public getConditionLabel(condition: FilterConditionEnum): string {
    return AttributeFilterHelper.getConditionTypes(true).find(c => c.condition === condition)?.label || '';
  }

}
