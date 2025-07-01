import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectComponentTitle } from '../../../state/core.selectors';
import { Store } from '@ngrx/store';

@Component({
  selector: 'tm-filter-menu-button',
  templateUrl: './filter-menu-button.component.html',
  styleUrls: ['./filter-menu-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FilterMenuButtonComponent {
  private store$ = inject(Store);

  public componentType = BaseComponentTypeEnum.FILTER;
  public panelTitle$ = this.store$.select(selectComponentTitle(this.componentType, $localize `:@@core.filter.filtering:Filtering`));
}
