import { Component, OnInit, ChangeDetectionStrategy, inject, OnDestroy, DestroyRef } from '@angular/core';
import { MenubarService } from '../../menubar';
import { FilterMenuButtonComponent } from '../filter-menu-button/filter-menu-button.component';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectSpatialFormVisible } from '../state/filter-component.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CreateFilterButtonComponent } from '../create-filter-button/create-filter-button.component';
import { ResetFiltersButtonComponent } from '../reset-filters-button/reset-filters-button.component';
import { SpatialFilterFormComponent } from '../spatial-filter-form/spatial-filter-form.component';
import { FilterListComponent } from '../filter-list/filter-list.component';
import { NgTemplateOutlet, AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-filter',
    templateUrl: './filter.component.html',
    styleUrls: ['./filter.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CreateFilterButtonComponent,
        ResetFiltersButtonComponent,
        SpatialFilterFormComponent,
        FilterListComponent,
        NgTemplateOutlet,
        AsyncPipe,
    ],
})
export class FilterComponent implements OnInit, OnDestroy {
  private store$ = inject(Store);
  private menubarService = inject(MenubarService);
  public visible$: Observable<boolean>;
  public spatialFormVisible$: Observable<boolean> = of(false);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.visible$ = this.menubarService.isComponentVisible$(BaseComponentTypeEnum.FILTER);
    this.spatialFormVisible$ = this.store$.select(selectSpatialFormVisible);

    this.visible$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(visible => {
        if (visible) {
          this.menubarService.setMobilePanelHeight(450);
        }
      });
  }

  public ngOnInit() {
    this.menubarService.registerComponent({ type: BaseComponentTypeEnum.FILTER, component: FilterMenuButtonComponent });
  }

  public ngOnDestroy() {
    this.menubarService.deregisterComponent(BaseComponentTypeEnum.FILTER);
  }

}
