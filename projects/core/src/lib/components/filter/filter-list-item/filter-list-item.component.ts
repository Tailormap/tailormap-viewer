import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from '@angular/core';
import { ExtendedFilterGroupModel } from '../../../filter/models/extended-filter-group.model';
import { FilterTypeEnum } from '../../../filter/models/filter-type.enum';
import { Store } from '@ngrx/store';
import { removeFilterGroup, toggleFilterDisabled } from '../../../filter/state/filter.actions';
import { AppLayerModel } from '@tailormap-viewer/api';
import { ConfirmDialogService } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-filter-list-item',
  templateUrl: './filter-list-item.component.html',
  styleUrls: ['./filter-list-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterListItemComponent implements OnInit {

  @Input()
  public filter: ExtendedFilterGroupModel | null = null;

  private store$ = inject(Store);
  private confirmService = inject(ConfirmDialogService);

  public ngOnInit(): void {
  }

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
    this.confirmService.confirm$(
      $localize `Remove filter?`,
      $localize `Are you sure you want to remove this filter?`,
      true,
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.store$.dispatch(removeFilterGroup({ filterGroupId: groupId }));
      }
    });
  }

}
