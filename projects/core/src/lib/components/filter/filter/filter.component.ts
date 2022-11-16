import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { MenubarService } from '../../menubar';
import { FilterMenuButtonComponent } from '../filter-menu-button/filter-menu-button.component';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { Observable } from 'rxjs';

@Component({
  selector: 'tm-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterComponent implements OnInit {

  private menubarService = inject(MenubarService);
  public visible$: Observable<boolean>;

  constructor() {
    this.visible$ = this.menubarService.isComponentVisible$(BaseComponentTypeEnum.FILTER);
  }

  public ngOnInit() {
    this.menubarService.registerComponent(FilterMenuButtonComponent);
  }

}
