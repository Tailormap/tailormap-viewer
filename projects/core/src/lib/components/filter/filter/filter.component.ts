import { Component, OnInit, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { MenubarService } from '../../menubar';
import { FilterMenuButtonComponent } from '../filter-menu-button/filter-menu-button.component';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectSpatialFormVisible } from '../state/filter-component.selectors';

@Component({
  selector: 'tm-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FilterComponent implements OnInit, OnDestroy {

  private store$ = inject(Store);
  private menubarService = inject(MenubarService);
  public visible$: Observable<boolean>;
  public spatialFormVisible$: Observable<boolean> = of(false);

  constructor() {
    this.visible$ = this.menubarService.isComponentVisible$(BaseComponentTypeEnum.FILTER);
    this.spatialFormVisible$ = this.store$.select(selectSpatialFormVisible);
  }

  public ngOnInit() {
    this.menubarService.registerComponent({ type: BaseComponentTypeEnum.FILTER, component: FilterMenuButtonComponent });
  }

  public ngOnDestroy() {
    this.menubarService.deregisterComponent(BaseComponentTypeEnum.FILTER);
  }

}
