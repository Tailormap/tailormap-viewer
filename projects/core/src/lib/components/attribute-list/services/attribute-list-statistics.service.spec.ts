import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { AttributeListStatisticsService } from './attribute-list-statistics.service';
import { AttributeListManagerService } from './attribute-list-manager.service';
import { FilterService } from '../../../filter/services/filter.service';
import { selectDataForSelectedTab, selectSelectedTab } from '../state/attribute-list.selectors';
import { selectViewerId } from '../../../state/core.selectors';
import { GetStatisticResponse, StatisticType } from '../models/attribute-list-api-service.model';
import { AttributeListTabModel } from '../models/attribute-list-tab.model';
import { AttributeListDataModel } from '../models/attribute-list-data.model';
import { AttributeListStatisticColumnModel } from '../models/attribute-list-statistic-column.model';
import { ATTRIBUTE_LIST_DEFAULT_SOURCE } from '../models/attribute-list-default-source.const';

const createMockTab = (layerId: string): AttributeListTabModel => ({
  id: '1',
  label: 'Test',
  tabSourceId: ATTRIBUTE_LIST_DEFAULT_SOURCE,
  layerId,
  selectedDataId: 'data1',
  initialDataId: 'data1',
  initialDataLoaded: false,
  loadingData: false,
});

const createMockData = (): AttributeListDataModel => ({
  id: 'data1',
  tabId: '1',
  columns: [],
  rows: [],
  pageIndex: 0,
  pageSize: 10,
  totalCount: null,
  sortDirection: '',
});

const setup = (options: {
  viewerId?: string | null;
  tab?: AttributeListTabModel | null;
  data?: AttributeListDataModel | null;
  getStatisticResponse?: GetStatisticResponse;
  canLoadStatistics?: boolean;
} = {}) => {
  const {
    viewerId = 'viewer1',
    tab = createMockTab('layer1'),
    data = createMockData(),
    getStatisticResponse = { result: 42, success: true },
    canLoadStatistics = true,
  } = options;

  const managerService = {
    canLoadStatistics: jest.fn().mockReturnValue(canLoadStatistics),
    getStatistic$: jest.fn().mockReturnValue(of(getStatisticResponse)),
  };

  const filterService = {
    getFilterForLayer: jest.fn().mockReturnValue(undefined),
  };

  TestBed.configureTestingModule({
    providers: [
      AttributeListStatisticsService,
      provideMockStore({
        selectors: [
          { selector: selectViewerId, value: viewerId },
          { selector: selectSelectedTab, value: tab },
          { selector: selectDataForSelectedTab, value: data },
        ],
      }),
      { provide: AttributeListManagerService, useValue: managerService },
      { provide: FilterService, useValue: filterService },
    ],
  });

  const service = TestBed.inject(AttributeListStatisticsService);
  const store = TestBed.inject(MockStore);
  return { service, store, managerService, filterService };
};

describe('AttributeListStatisticsService', () => {

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    const { service } = setup();
    expect(service).toBeTruthy();
  });

  describe('canLoadStatistics$', () => {

    it('should return false when no viewerId', done => {
      const { service } = setup({ viewerId: null });
      service.canLoadStatistics$.pipe(take(1)).subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });

    it('should return false when no selected tab', done => {
      const { service } = setup({ tab: null });
      service.canLoadStatistics$.pipe(take(1)).subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });

    it('should return false when manager service cannot load statistics', done => {
      const { service } = setup({ canLoadStatistics: false });
      service.canLoadStatistics$.pipe(take(1)).subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });

    it('should return true when all conditions are met', done => {
      const { service } = setup({ canLoadStatistics: true });
      service.canLoadStatistics$.pipe(take(1)).subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });

  });

  describe('statistics$', () => {

    it('should return empty array when no statistics have been loaded', done => {
      const { service } = setup();
      service.statistics$.pipe(take(1)).subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

  });

  describe('loadStatistics', () => {

    it('loading -> success: should set isLoading=true then resolve with value after success', () => {
      const { service } = setup({ getStatisticResponse: { result: 99, success: true } });
      const emissions: AttributeListStatisticColumnModel[][] = [];
      service.statistics$.subscribe(stats => emissions.push(stats));
      service.loadStatistics({ type: StatisticType.SUM, columnName: 'amount', dataType: 'integer' });
      const resolvedEmission = emissions[emissions.length - 1];
      expect(resolvedEmission.length).toBe(1);
      expect(resolvedEmission[0].isLoading).toBe(false);
      expect(resolvedEmission[0].value).toBe(99);
      expect(resolvedEmission[0].hasError).toBeFalsy();
      expect(resolvedEmission[0].type).toBe(StatisticType.SUM);
    });

    it('loading -> error: should set hasError=true and value=null when loading fails', () => {
      const { service } = setup({ getStatisticResponse: { result: null, success: false } });
      const emissions: AttributeListStatisticColumnModel[][] = [];
      service.statistics$.subscribe(stats => emissions.push(stats));

      service.loadStatistics({ type: StatisticType.SUM, columnName: 'amount', dataType: 'integer' });

      const resolvedEmission = emissions[emissions.length - 1];
      expect(resolvedEmission.length).toBe(1);
      expect(resolvedEmission[0].isLoading).toBe(false);
      expect(resolvedEmission[0].hasError).toBe(true);
      expect(resolvedEmission[0].value).toBe(null);
    });

    it('deduping: should not reload when the same column+type combination is requested again', () => {
      const { service, managerService } = setup();
      service.loadStatistics({ type: StatisticType.SUM, columnName: 'amount', dataType: 'integer' });
      // Second call with the same parameters
      service.loadStatistics({ type: StatisticType.SUM, columnName: 'amount', dataType: 'integer' });
      // API should have been called only once
      expect(managerService.getStatistic$).toHaveBeenCalledTimes(1);
    });

    it('replacement: should replace an existing statistic when a new type is selected for the same column', () => {
      const { service } = setup();
      const emissions: AttributeListStatisticColumnModel[][] = [];
      service.statistics$.subscribe(stats => emissions.push(stats));

      service.loadStatistics({ type: StatisticType.SUM, columnName: 'amount', dataType: 'integer' });
      service.loadStatistics({ type: StatisticType.MAX, columnName: 'amount', dataType: 'integer' });

      const finalStats = emissions[emissions.length - 1];
      // Only one entry for 'amount' - SUM should be replaced by MAX
      expect(finalStats.length).toBe(1);
      expect(finalStats[0].type).toBe(StatisticType.MAX);
      expect(finalStats[0].columnName).toBe('amount');
    });

    it('NONE-clearing: should remove an existing column statistic when NONE type is selected', () => {
      const { service } = setup();
      const emissions: AttributeListStatisticColumnModel[][] = [];
      service.statistics$.subscribe(stats => emissions.push(stats));

      service.loadStatistics({ type: StatisticType.SUM, columnName: 'amount', dataType: 'integer' });
      // Verify statistic was added
      const afterLoad = emissions[emissions.length - 1];
      expect(afterLoad.length).toBe(1);

      service.loadStatistics({ type: StatisticType.NONE, columnName: 'amount', dataType: 'integer' });
      // Statistic should be cleared
      const afterNone = emissions[emissions.length - 1];
      expect(afterNone).toEqual([]);
    });

    it('NONE-clearing: should only clear the targeted column, leaving other columns intact', () => {
      const { service } = setup();
      const emissions: AttributeListStatisticColumnModel[][] = [];
      service.statistics$.subscribe(stats => emissions.push(stats));

      service.loadStatistics({ type: StatisticType.SUM, columnName: 'amount', dataType: 'integer' });
      service.loadStatistics({ type: StatisticType.COUNT, columnName: 'name', dataType: 'string' });
      const afterBothLoaded = emissions[emissions.length - 1];
      expect(afterBothLoaded.length).toBe(2);

      service.loadStatistics({ type: StatisticType.NONE, columnName: 'amount', dataType: 'integer' });
      const afterNone = emissions[emissions.length - 1];
      // Only 'amount' cleared, 'name' remains
      expect(afterNone.length).toBe(1);
      expect(afterNone[0].columnName).toBe('name');
    });

    it('keying by viewerId+layerId: statistics are stored independently per viewer and layer', () => {
      const tab1 = createMockTab('layer1');
      const tab2 = createMockTab('layer2');
      const { service, store } = setup();
      const emissions: AttributeListStatisticColumnModel[][] = [];
      service.statistics$.subscribe(stats => emissions.push(stats));

      // Load a SUM statistic for viewer1+layer1
      service.loadStatistics({ type: StatisticType.SUM, columnName: 'amount', dataType: 'integer' });
      const afterLayer1Load = emissions[emissions.length - 1];
      expect(afterLayer1Load.length).toBe(1);
      expect(afterLayer1Load[0].type).toBe(StatisticType.SUM);

      // Switch to layer2
      store.overrideSelector(selectSelectedTab, tab2);
      store.refreshState();

      // Load a COUNT statistic for viewer1+layer2
      service.loadStatistics({ type: StatisticType.COUNT, columnName: 'amount', dataType: 'integer' });
      const afterLayer2Load = emissions[emissions.length - 1];
      // statistics$ shows only layer2 stats
      expect(afterLayer2Load.length).toBe(1);
      expect(afterLayer2Load[0].type).toBe(StatisticType.COUNT);

      // Switch back to layer1 - its statistics should still be there
      store.overrideSelector(selectSelectedTab, tab1);
      store.refreshState();
      const afterSwitchBackToLayer1 = emissions[emissions.length - 1];
      expect(afterSwitchBackToLayer1.length).toBe(1);
      expect(afterSwitchBackToLayer1[0].type).toBe(StatisticType.SUM);
    });

    it('should not load statistics when no selected tab is available', () => {
      const { service, managerService } = setup({ tab: null });
      service.loadStatistics({ type: StatisticType.SUM, columnName: 'amount', dataType: 'integer' });
      expect(managerService.getStatistic$).not.toHaveBeenCalled();
    });

    it('should not load statistics when no viewerId is available', () => {
      const { service, managerService } = setup({ viewerId: null });
      service.loadStatistics({ type: StatisticType.SUM, columnName: 'amount', dataType: 'integer' });
      expect(managerService.getStatistic$).not.toHaveBeenCalled();
    });

  });

});
