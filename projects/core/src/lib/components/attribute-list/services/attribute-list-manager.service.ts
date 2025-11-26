import { Injectable, OnDestroy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { concatMap, filter, map, takeUntil, withLatestFrom } from 'rxjs/operators';
import { combineLatest, forkJoin, Observable, of, Subject } from 'rxjs';
import { selectAttributeListTabs, selectAttributeListVisible } from '../state/attribute-list.selectors';
import { changeAttributeListTabs } from '../state/attribute-list.actions';
import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { nanoid } from 'nanoid';
import { AttributeListDataModel } from '../models/attribute-list-data.model';
import { selectVisibleLayersWithAttributes } from '../../../map/state/map.selectors';
import { AppLayerModel, HiddenLayerFunctionality } from '@tailormap-viewer/api';
import { DEFAULT_ATTRIBUTE_LIST_CONFIG } from '../models/attribute-list-config.model';

interface TabFromLayerResult {
  tab: AttributeListTabModel;
  data: AttributeListDataModel[];
}

@Injectable({
  providedIn: 'root',
})
export class AttributeListManagerService implements OnDestroy {
  private store$ = inject(Store);


  public static readonly EMPTY_ATTRIBUTE_LIST_TAB: AttributeListTabModel = {
    id: '',
    label: '',
    selectedDataId: '',
    initialDataLoaded: false,
    loadingData: false,
  };

  public static readonly EMPTY_ATTRIBUTE_LIST_DATA: AttributeListDataModel = {
    id: '',
    tabId: '',
    columns: [],
    rows: [],
    pageIndex: 1,
    pageSize: 100,
    totalCount: null,
    sortDirection: '',
  };

  private destroyed = new Subject();

  constructor() {
    combineLatest([
      this.store$.select(selectVisibleLayersWithAttributes),
      this.store$.select(selectAttributeListVisible),
    ])
      .pipe(
        takeUntil(this.destroyed),
        filter(([ _layers, attributeListVisible ]) => attributeListVisible),
        map(([ layers, _attributeListVisible ]) => layers),
        map(layers => layers.filter(l => !l.hiddenFunctionality?.includes(HiddenLayerFunctionality.attributeList))),
        withLatestFrom(this.store$.select(selectAttributeListTabs)),
        concatMap(([ layers, tabs ]) => {
          const closedTabs = this.getClosedTabs(layers, tabs);
          const newTabs$ = this.getNewTabs$(layers, tabs);
          return forkJoin([ of(closedTabs), newTabs$ ]);
        }),
        filter(([ closedTabs, newTabs ]) => closedTabs.length > 0 || newTabs.length > 0),
      )
      .subscribe(([ closedTabs, newTabs ]) => {
        this.store$.dispatch(changeAttributeListTabs({
          newTabs: newTabs.map(result => result.tab),
          newData: newTabs.reduce<AttributeListDataModel[]>((data, result) => data.concat(...result.data), []),
          closedTabs,
        }));
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private getClosedTabs(visibleLayers: AppLayerModel[], currentTabs: AttributeListTabModel[]): string[] {
    if (!currentTabs || currentTabs.length === 0) {
      return [];
    }
    return currentTabs
      .filter(tab => visibleLayers.findIndex(l => l.id === tab.layerId) === -1)
      .map<string>(tab => tab.id);
  }

  private getNewTabs$(
    visibleLayers: AppLayerModel[],
    currentTabs: AttributeListTabModel[],
  ): Observable<TabFromLayerResult[]> {
    if (!visibleLayers || visibleLayers.length === 0) {
      return of([]);
    }
    const layersWithoutTab = visibleLayers.filter(layer => currentTabs.findIndex(t => t.layerId === layer.id) === -1);
    if (layersWithoutTab.length === 0) {
      return of([]);
    }
    return forkJoin(layersWithoutTab.map<Observable<TabFromLayerResult>>(layer => {
      return this.createTabFromLayer$(layer, DEFAULT_ATTRIBUTE_LIST_CONFIG.pageSize);
    }));
  }

  private createTabFromLayer$(
    layer: AppLayerModel,
    pageSize = 10,
  ): Observable<TabFromLayerResult> {
      const id = nanoid();
      const dataId = nanoid();
      const tab: AttributeListTabModel = {
        ...AttributeListManagerService.EMPTY_ATTRIBUTE_LIST_TAB,
        id,
        layerId: layer.id,
        label: layer.title || layer.layerName,
        selectedDataId: dataId,
      };
      const data: AttributeListDataModel = {
        ...AttributeListManagerService.EMPTY_ATTRIBUTE_LIST_DATA,
        id: dataId,
        tabId: id,
        pageSize,
      };
      return of({ tab, data: [data] });
  }

}
