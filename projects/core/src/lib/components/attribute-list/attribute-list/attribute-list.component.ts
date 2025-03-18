import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AttributeListState } from '../state/attribute-list.state';
import {
  selectAttributeListPanelTitle, selectAttributeListSelectedTab, selectAttributeListTabs,
  selectAttributeListVisible,
  selectCurrentlySelectedFeatureGeometry,
} from '../state/attribute-list.selectors';
import { filter, map, Observable, of, Subject } from 'rxjs';
import {  takeUntil } from 'rxjs/operators';
import { setAttributeListVisibility, setSelectedTab } from '../state/attribute-list.actions';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { MenubarService } from '../../menubar';
import { AttributeListMenuButtonComponent } from '../attribute-list-menu-button/attribute-list-menu-button.component';
import { selectVisibleLayersWithAttributes } from '../../../map/state/map.selectors';
import { FeatureStylingHelper } from '../../../shared/helpers/feature-styling.helper';
import { MapService } from '@tailormap-viewer/map';
import { BaseComponentTypeEnum, HiddenLayerFunctionality } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-attribute-list',
  templateUrl: './attribute-list.component.html',
  styleUrls: ['./attribute-list.component.css'],
  standalone: false,
})
export class AttributeListComponent implements OnInit, OnDestroy {

  public isVisible$: Observable<boolean>;

  public tabs: AttributeListTabModel[] = [];
  private destroyed = new Subject();

  public selectedTab?: string;
  public hasLayersWithAttributes$: Observable<boolean>;
  public title$: Observable<string> = of('');

  constructor(
    private store$: Store<AttributeListState>,
    private menubarService: MenubarService,
    private mapService: MapService,
  ) {
    this.isVisible$ = this.store$.select(selectAttributeListVisible);
    this.title$ = this.store$.select(selectAttributeListPanelTitle);
    this.store$.select(selectAttributeListTabs)
      .pipe(takeUntil(this.destroyed))
      .subscribe(tabs => {
        this.tabs = tabs;
      });
    this.store$.select(selectAttributeListSelectedTab)
      .pipe(takeUntil(this.destroyed))
      .subscribe(selectedTab => this.selectedTab = selectedTab);
    this.hasLayersWithAttributes$ = this.store$.select(selectVisibleLayersWithAttributes).pipe(
      map(layers => layers.filter(l => !l.hiddenFunctionality?.includes(HiddenLayerFunctionality.attributeList))),
      map(layers => (layers || []).length > 0),
    );
  }

  public ngOnInit() {
    this.menubarService.registerComponent({ type: BaseComponentTypeEnum.ATTRIBUTE_LIST, component: AttributeListMenuButtonComponent });

    this.mapService.renderFeatures$(
      'attribute-list-highlight-layer',
      this.store$.select(selectCurrentlySelectedFeatureGeometry),
      FeatureStylingHelper.getDefaultHighlightStyle('attribute-list-highlight-style'),
      { zoomToFeature: true },
    )
      .pipe(takeUntil(this.destroyed))
      .subscribe();
  }

  public ngOnDestroy(): void {
    this.store$.dispatch(setAttributeListVisibility({ visible: false }));
    this.destroyed.next(null);
    this.destroyed.complete();
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

}
