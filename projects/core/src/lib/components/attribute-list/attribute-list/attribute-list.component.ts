import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AttributeListState } from '../state/attribute-list.state';
import {
  selectAttributeListHeight, selectAttributeListSelectedTab, selectAttributeListTabs, selectAttributeListVisible,
} from '../state/attribute-list.selectors';
import { map, Observable, Subject } from 'rxjs';
import {  takeUntil } from 'rxjs/operators';
import { setAttributeListVisibility, setSelectedTab, updateAttributeListHeight } from '../state/attribute-list.actions';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { MenubarService } from '../../menubar';
import { AttributeListMenuButtonComponent } from '../attribute-list-menu-button/attribute-list-menu-button.component';
import { selectVisibleLayers } from '../../../map/state/map.selectors';

@Component({
  selector: 'tm-attribute-list',
  templateUrl: './attribute-list.component.html',
  styleUrls: ['./attribute-list.component.css'],
})
export class AttributeListComponent implements OnInit {

  public isVisible$: Observable<boolean>;

  public tabs: AttributeListTabModel[] = [];
  private destroyed = new Subject();

  public height = 0;
  public minimized = false;
  public maximized = false;
  public selectedTab?: string;
  public hasLayersWithAttributes$: Observable<boolean>;

  constructor(
    private store$: Store<AttributeListState>,
    private menubarService: MenubarService,
  ) {
    this.isVisible$ = this.store$.select(selectAttributeListVisible);
    this.store$.select(selectAttributeListTabs)
      .pipe(takeUntil(this.destroyed))
      .subscribe(tabs => {
        this.tabs = tabs;
      });
    this.store$.select(selectAttributeListHeight)
      .pipe(takeUntil(this.destroyed))
      .subscribe(height => this.height = height);
    this.store$.select(selectAttributeListSelectedTab)
      .pipe(takeUntil(this.destroyed))
      .subscribe(selectedTab => this.selectedTab = selectedTab);
    this.hasLayersWithAttributes$ = this.store$.select(selectVisibleLayers)
      .pipe(map(layers => (layers || []).length > 0));
  }

  public ngOnInit() {
    this.menubarService.registerComponent(AttributeListMenuButtonComponent);
  }

  public onMaximizeClick(): void {
    this.maximized = !this.maximized;
    if (this.maximized) {
      this.minimized = false;
    }
  }

  public onMinimizeClick(): void {
    this.minimized = !this.minimized;
    if (this.minimized) {
      this.maximized = false;
    }
  }

  public onCloseClick(): void {
    this.store$.dispatch(setAttributeListVisibility({ visible: false }));
  }

  public onSelectedTabChange($event: MatTabChangeEvent): void {
    this.store$.dispatch(setSelectedTab({ tabId: this.tabs[$event.index].id }));
  }

  public trackByTabId(idx: number, layer: AttributeListTabModel) {
    return layer.id;
  }

  public sizeChanged(changedHeight: number) {
    let initialHeight = this.height;
    if (this.minimized) {
      initialHeight = 0;
    }
    if (this.maximized) {
      initialHeight = window.innerHeight;
    }
    this.minimized = false;
    this.maximized = false;
    this.store$.dispatch(updateAttributeListHeight({ height: initialHeight - changedHeight }));
  }

}
