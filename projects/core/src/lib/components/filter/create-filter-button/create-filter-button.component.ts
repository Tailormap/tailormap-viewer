import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FilterTypeEnum } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { createFilter } from '../state/filter-component.actions';
import { MatButton } from '@angular/material/button';
import { TooltipDirective } from '../../../../../../shared/src/lib/directives/tooltip.directive';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'tm-create-filter-button',
    templateUrl: './create-filter-button.component.html',
    styleUrls: ['./create-filter-button.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatButton,
        TooltipDirective,
        MatIcon,
    ],
})
export class CreateFilterButtonComponent {
  public filterTypes = FilterTypeEnum;
  private store$ = inject(Store);

  public createFilter(filterType: FilterTypeEnum) {
    this.store$.dispatch(createFilter({ filterType }));
  }
}
