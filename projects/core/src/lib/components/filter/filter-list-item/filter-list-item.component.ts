import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { ExtendedFilterGroupModel } from '../../../filter/models/extended-filter-group.model';
import { FilterTypeEnum, FilterGroupModel } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { toggleFilterDisabled } from '../../../filter/state/filter.actions';
import { AppLayerModel } from '@tailormap-viewer/api';
import { setSelectedFilterGroup } from '../state/filter-component.actions';
import { RemoveFilterService } from '../services/remove-filter.service';
import { FilterTypeHelper } from '../../../filter/helpers/filter-type.helper';

@Component({
  selector: 'tm-filter-list-item',
  templateUrl: './filter-list-item.component.html',
  styleUrls: ['./filter-list-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FilterListItemComponent {

  @Input()
  public filter: ExtendedFilterGroupModel | null = null;

  private store$ = inject(Store);
  private removeFilterService = inject(RemoveFilterService);

  public isAttributeFilter(type: FilterTypeEnum) {
    return type === FilterTypeEnum.ATTRIBUTE;
  }

  public isSpatialFilter(type: FilterTypeEnum) {
    return type === FilterTypeEnum.SPATIAL;
  }

  public getLayerList(layers: AppLayerModel[]) {
    return layers.map(l => l.title).join(', ');
  }

  public toggleDisabled(groupId: string) {
    this.store$.dispatch(toggleFilterDisabled({ filterGroupId: groupId }));
  }

  public removeFilter(groupId: string) {
    this.removeFilterService.removeFilter$(groupId).subscribe();
  }

  public editFilter(group: FilterGroupModel) {
    if (!FilterTypeHelper.isSpatialFilterGroup(group)) {
      return;
    }
    this.store$.dispatch(setSelectedFilterGroup({ filterGroup: group }));
  }

}
