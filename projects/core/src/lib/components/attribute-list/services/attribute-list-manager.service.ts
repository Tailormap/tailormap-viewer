import { Injectable, OnDestroy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { concatMap, filter, map, takeUntil, withLatestFrom } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, forkJoin, Observable, of, Subject, switchMap } from 'rxjs';
import { selectAttributeListTabs, selectAttributeListVisible } from '../state/attribute-list.selectors';
import { changeAttributeListTabs } from '../state/attribute-list.actions';
import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { nanoid } from 'nanoid';
import { AttributeListDataModel } from '../models/attribute-list-data.model';
import { selectVisibleLayersWithAttributes } from '../../../map/state/map.selectors';
import {
  FeaturesResponseModel, HiddenLayerFunctionality, LayerExportCapabilitiesModel, UniqueValueParams, UniqueValuesResponseModel,
} from '@tailormap-viewer/api';
import { DEFAULT_ATTRIBUTE_LIST_CONFIG } from '../models/attribute-list-config.model';
import { AttributeListSourceModel, TabModel } from '../models/attribute-list-source.model';
import { AttributeListApiService } from './attribute-list-api.service';
import {
  GetFeaturesParams, GetLayerExportCapabilitiesParams, GetLayerExportParams, GetLayerExportResponse,
} from '../models/attribute-list-api-service.model';
import { ATTRIBUTE_LIST_DEFAULT_SOURCE } from '../models/attribute-list-default-source.const';

interface TabModelWithTabSourceId extends TabModel {
  tabSourceId: string;
}

interface TabFromLayerResult {
  tab: AttributeListTabModel;
  data: AttributeListDataModel[];
}

@Injectable({
  providedIn: 'root',
})
export class AttributeListManagerService implements OnDestroy {

  private store$ = inject(Store);
  private defaultApiService = inject(AttributeListApiService);

  private sources$ = new BehaviorSubject<AttributeListSourceModel[]>([]);
  private tabsFromSources$ = this.sources$.asObservable()
    .pipe(
      switchMap(sources => {
        if (sources.length === 0) {
          return of([]);
        }
        return combineLatest(sources.map(s => {
          return s.tabs$.pipe(map(tabs => tabs.map(tab => ({
            ...tab,
            tabSourceId: s.id,
          }))));
        })).pipe(map(tabs => tabs.flat()));
      }),
    );

  public static readonly EMPTY_ATTRIBUTE_LIST_TAB: AttributeListTabModel = {
    id: '',
    label: '',
    selectedDataId: '',
    initialDataLoaded: false,
    loadingData: false,
    tabSourceId: '',
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
      this.tabsFromSources$,
      this.store$.select(selectAttributeListVisible),
    ])
      .pipe(
        takeUntil(this.destroyed),
        filter(([ _tabSources, attributeListVisible ]) => attributeListVisible),
        map(([ tabSources, _attributeListVisible ]) => tabSources),
        withLatestFrom(this.store$.select(selectAttributeListTabs)),
        concatMap(([ tabSources, tabs ]) => {
          const closedTabs = this.getClosedTabs(tabSources, tabs);
          const newTabs$ = this.getNewTabs$(tabSources, tabs);
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

  public getFeatures$(tabSourceId: string, params: GetFeaturesParams): Observable<FeaturesResponseModel> {
    const source = this.sources$.getValue().find(s => s.id === tabSourceId);
    if (!source) {
      return of({ features: [], columnMetadata: [], total: null, page: null, pageSize: null, template: null });
    }
    return source.dataLoader.getFeatures$(params);
  }

  public getLayerExportCapabilities$(tabSourceId: string, params: GetLayerExportCapabilitiesParams): Observable<LayerExportCapabilitiesModel> {
    const source = this.sources$.getValue().find(s => s.id === tabSourceId);
    if (!source) {
      return of({ exportable: false, outputFormats: [] });
    }
    return source.dataLoader.getLayerExportCapabilities$(params);
  }

  public getLayerExport$(tabSourceId: string, params: GetLayerExportParams): Observable<GetLayerExportResponse | null> {
    const source = this.sources$.getValue().find(s => s.id === tabSourceId);
    if (!source) {
      return of(null);
    }
    return source.dataLoader.getLayerExport$(params);
  }

  public getUniqueValues$(tabSourceId: string, params: UniqueValueParams): Observable<UniqueValuesResponseModel> {
    const source = this.sources$.getValue().find(s => s.id === tabSourceId);
    if (!source) {
      return of({ values: [], filterApplied: false });
    }
    return source.dataLoader.getUniqueValues$(params);
  }

  public addAttributeListSource(source: AttributeListSourceModel): void {
    this.sources$.next([
      ...this.sources$.getValue(),
      source,
    ]);
  }

  public initDefaultAttributeListSource(): void {
    this.addAttributeListSource({
      id: ATTRIBUTE_LIST_DEFAULT_SOURCE,
      tabs$: this.store$.select(selectVisibleLayersWithAttributes).pipe(
        map(layers => {
          return layers
            .filter(l => !l.hiddenFunctionality?.includes(HiddenLayerFunctionality.attributeList))
            .map(l => ({ id: l.id, label: l.title || l.layerName }));
        })),
      dataLoader: this.defaultApiService,
    });
  }

  private getClosedTabs(visibleTabs: TabModel[], currentTabs: AttributeListTabModel[]): string[] {
    if (!currentTabs || currentTabs.length === 0) {
      return [];
    }
    return currentTabs
      .filter(tab => visibleTabs.findIndex(l => l.id === tab.layerId) === -1)
      .map<string>(tab => tab.id);
  }

  private getNewTabs$(
    visibleTabs: TabModelWithTabSourceId[],
    currentTabs: AttributeListTabModel[],
  ): Observable<TabFromLayerResult[]> {
    if (!visibleTabs || visibleTabs.length === 0) {
      return of([]);
    }
    const layersWithoutTab = visibleTabs.filter(layer => currentTabs.findIndex(t => t.layerId === layer.id) === -1);
    if (layersWithoutTab.length === 0) {
      return of([]);
    }
    return forkJoin(layersWithoutTab.map<Observable<TabFromLayerResult>>(layer => {
      return this.createTabFromModel$(layer, DEFAULT_ATTRIBUTE_LIST_CONFIG.pageSize);
    }));
  }

  private createTabFromModel$(
    tabModel: TabModelWithTabSourceId,
    pageSize = 10,
  ): Observable<TabFromLayerResult> {
      const id = nanoid();
      const dataId = nanoid();
      const tab: AttributeListTabModel = {
        ...AttributeListManagerService.EMPTY_ATTRIBUTE_LIST_TAB,
        id,
        layerId: tabModel.id,
        label: tabModel.label,
        selectedDataId: dataId,
        tabSourceId: tabModel.tabSourceId,
        featureType: tabModel.featureType,
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
