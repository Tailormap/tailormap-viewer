import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Action } from '@ngrx/store';
import { Subject, delay, of } from 'rxjs';
import { AttributeListEffects } from './attribute-list.effects';
import { AttributeListDataService } from '../services/attribute-list-data.service';
import { AttributeListManagerService } from '../services/attribute-list-manager.service';
import { LoadAttributeListDataResultModel } from '../models/load-attribute-list-data-result.model';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';
import { createDummyAttributeListData, createDummyRows, getLoadedStoreWithMultipleTabs } from './mocks/attribute-list-state-test-data';
import * as AttributeListActions from './attribute-list.actions';
import { selectViewerId } from '../../../state/core.selectors';
import { ATTRIBUTE_LIST_DEFAULT_SOURCE } from '../models/attribute-list-default-source.const';

const createResult = (id: string, success = true): LoadAttributeListDataResultModel => ({
  id,
  success,
  totalCount: 0,
  columns: [],
  rows: [],
  pageSize: 10,
});

describe('AttributeListEffects', () => {

  const setup = (loadDataForTabMock?: jest.Mock, initialState = getLoadedStoreWithMultipleTabs()) => {
    const actions$ = new Subject<Action>();
    const loadDataForTab$ = loadDataForTabMock ?? jest.fn((tabId: string) => of(createResult(tabId)));
    const notifyCheckedRowsChanged = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        AttributeListEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState,
          selectors: [{ selector: selectViewerId, value: 'app1' }],
        }),
        { provide: AttributeListDataService, useValue: { loadDataForTab$ } },
        { provide: AttributeListManagerService, useValue: { notifyCheckedRowsChanged } },
        getMapServiceMock().provider,
      ],
    });
    const effects = TestBed.inject(AttributeListEffects);
    const dispatched: Action[] = [];
    effects.loadData$.subscribe(action => dispatched.push(action));
    effects.loadDataForTab$.subscribe();
    effects.loadDataAfterSelectedDataIdChange$.subscribe();
    effects.loadDataAfterChanges$.subscribe();
    effects.notifyCheckedRowsChanged$.subscribe();
    return { actions$, loadDataForTab$, dispatched, notifyCheckedRowsChanged };
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('loads data after the debounce period', () => {
    const { actions$, loadDataForTab$, dispatched } = setup();
    actions$.next(AttributeListActions.loadData({ tabId: '1' }));
    expect(loadDataForTab$).not.toHaveBeenCalled();
    jest.advanceTimersByTime(50);
    expect(loadDataForTab$).toHaveBeenCalledTimes(1);
    expect(loadDataForTab$).toHaveBeenCalledWith('1');
    expect(dispatched).toEqual([
      AttributeListActions.loadDataSuccess({ tabId: '1', data: createResult('1') }),
    ]);
  });

  it('loads data only once when multiple triggers for the same tab arrive quickly', () => {
    const { actions$, loadDataForTab$, dispatched } = setup();
    actions$.next(AttributeListActions.loadData({ tabId: '1' }));
    actions$.next(AttributeListActions.setSelectedDataId({ tabId: '1', dataId: '1' }));
    actions$.next(AttributeListActions.updatePage({ dataId: '1', page: 2 }));
    jest.advanceTimersByTime(50);
    expect(loadDataForTab$).toHaveBeenCalledTimes(1);
    expect(dispatched).toEqual([
      AttributeListActions.loadDataSuccess({ tabId: '1', data: createResult('1') }),
    ]);
  });

  it('postpones loading while triggers for the same tab keep arriving within the debounce period', () => {
    const { actions$, loadDataForTab$ } = setup();
    actions$.next(AttributeListActions.loadData({ tabId: '1' }));
    jest.advanceTimersByTime(30);
    actions$.next(AttributeListActions.loadData({ tabId: '1' }));
    jest.advanceTimersByTime(30);
    expect(loadDataForTab$).not.toHaveBeenCalled();
    jest.advanceTimersByTime(20);
    expect(loadDataForTab$).toHaveBeenCalledTimes(1);
  });

  it('loads data for different tabs independently without debouncing each other', () => {
    const { actions$, loadDataForTab$, dispatched } = setup();
    actions$.next(AttributeListActions.loadData({ tabId: '1' }));
    actions$.next(AttributeListActions.loadData({ tabId: '2' }));
    jest.advanceTimersByTime(50);
    expect(loadDataForTab$).toHaveBeenCalledTimes(2);
    expect(loadDataForTab$).toHaveBeenCalledWith('1');
    expect(loadDataForTab$).toHaveBeenCalledWith('2');
    expect(dispatched).toEqual([
      AttributeListActions.loadDataSuccess({ tabId: '1', data: createResult('1') }),
      AttributeListActions.loadDataSuccess({ tabId: '2', data: createResult('2') }),
    ]);
  });

  it('cancels an in-flight load when a new trigger for the same tab arrives', () => {
    const loadDataForTab$ = jest.fn((tabId: string) => of(createResult(tabId)).pipe(delay(100)));
    const { actions$, dispatched } = setup(loadDataForTab$);
    actions$.next(AttributeListActions.loadData({ tabId: '1' }));
    jest.advanceTimersByTime(50);
    expect(loadDataForTab$).toHaveBeenCalledTimes(1);
    actions$.next(AttributeListActions.loadData({ tabId: '1' }));
    jest.advanceTimersByTime(50);
    expect(loadDataForTab$).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(100);
    expect(dispatched).toEqual([
      AttributeListActions.loadDataSuccess({ tabId: '1', data: createResult('1') }),
    ]);
  });

  it('dispatches loadDataFailed when loading fails', () => {
    const loadDataForTab$ = jest.fn((tabId: string) => of(createResult(tabId, false)));
    const { actions$, dispatched } = setup(loadDataForTab$);
    actions$.next(AttributeListActions.loadData({ tabId: '1' }));
    jest.advanceTimersByTime(50);
    expect(dispatched).toEqual([
      AttributeListActions.loadDataFailed({ tabId: '1', data: createResult('1', false) }),
    ]);
  });

  describe('notifyCheckedRowsChanged$', () => {

    const getStoreWithCheckedRows = () => getLoadedStoreWithMultipleTabs({
      data: [
        createDummyAttributeListData({
          id: '1',
          tabId: '1',
          rows: createDummyRows(10),
          checkedRows: [{ id: '1', __fid: '1' }, { id: '3', __fid: '3' }],
        }),
      ],
    });

    it('notifies the manager service with the full checked set when a row is checked', () => {
      const { actions$, notifyCheckedRowsChanged } = setup(undefined, getStoreWithCheckedRows());
      actions$.next(AttributeListActions.updateRowChecked({ tabId: '1', dataId: '1', rowId: '3', checked: true }));
      expect(notifyCheckedRowsChanged).toHaveBeenCalledTimes(1);
      expect(notifyCheckedRowsChanged).toHaveBeenCalledWith(ATTRIBUTE_LIST_DEFAULT_SOURCE, {
        applicationId: 'app1',
        layerId: '1',
        checkedRows: [{ __fid: '1' }, { __fid: '3' }],
      });
    });

    it('notifies the manager service when all rows are checked or unchecked', () => {
      const { actions$, notifyCheckedRowsChanged } = setup(undefined, getStoreWithCheckedRows());
      actions$.next(AttributeListActions.updateAllRowsChecked({ tabId: '1', dataId: '1', checked: true }));
      expect(notifyCheckedRowsChanged).toHaveBeenCalledTimes(1);
      expect(notifyCheckedRowsChanged).toHaveBeenCalledWith(ATTRIBUTE_LIST_DEFAULT_SOURCE, {
        applicationId: 'app1',
        layerId: '1',
        checkedRows: [{ __fid: '1' }, { __fid: '3' }],
      });
    });

    it('does not notify for unknown data ids', () => {
      const { actions$, notifyCheckedRowsChanged } = setup(undefined, getStoreWithCheckedRows());
      actions$.next(AttributeListActions.updateRowChecked({ tabId: '1', dataId: 'unknown', rowId: '3', checked: true }));
      expect(notifyCheckedRowsChanged).not.toHaveBeenCalled();
    });

  });

});
