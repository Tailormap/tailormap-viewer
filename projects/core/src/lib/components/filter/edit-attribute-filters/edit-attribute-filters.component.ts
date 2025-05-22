import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AttributeFilterModel, FilterToolEnum, SliderFilterModel } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { updateFilter } from '../../../filter/state/filter.actions';

@Component({
  selector: 'tm-edit-attribute-filter',
  templateUrl: './edit-attribute-filters.component.html',
  styleUrls: ['./edit-attribute-filters.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EditAttributeFiltersComponent {

  public editableFilters = input<AttributeFilterModel[]>([]);
  public filterGroupId = input<string | null>(null);

  constructor(private store$: Store) { }

  public getSliderFilterConfiguration(filter: AttributeFilterModel): SliderFilterModel | null {
    return filter.editConfiguration?.filterTool === FilterToolEnum.SLIDER ? filter.editConfiguration : null;
  }

  public updateSliderFilterValue($event: number, filter: AttributeFilterModel) {
    const newFilter: AttributeFilterModel = {
      ...filter,
      value: [`${$event}`],
    };
    if (this.filterGroupId()) {
      this.store$.dispatch(updateFilter({ filterGroupId: this.filterGroupId() ?? '', filter: newFilter }));
    }
  }

  public updateBetweenSliderFilterValues($event: { lower: number; upper: number }, filter: AttributeFilterModel) {
    const newFilter: AttributeFilterModel = {
      ...filter,
      value: [ `${$event.lower}`, `${$event.upper}` ],
    };
    if (this.filterGroupId()) {
      this.store$.dispatch(updateFilter({ filterGroupId: this.filterGroupId() ?? '', filter: newFilter }));
    }

  }
}
