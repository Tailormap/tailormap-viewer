import { describe, test, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngrx/store';
import { FeatureTypeModel, getFeatureSource, getFeatureType, TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { FeatureSourceService } from './feature-source.service';
import { CatalogService } from './catalog.service';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { AdminSseService } from '../../shared/services/admin-sse.service';
import { catalogReducer } from '../state/catalog.reducer';
import { catalogStateKey, CatalogState, initialCatalogState } from '../state/catalog.state';
import { loadDraftFeatureSourceSuccess, updateFeatureType } from '../state/catalog.actions';

const setup = (catalogState: Partial<CatalogState>) => {
  const loadDraftFeatureSource = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      provideStore({ [catalogStateKey]: catalogReducer }, { initialState: { [catalogStateKey]: { ...initialCatalogState, ...catalogState } } }),
      { provide: TailormapAdminApiV1Service, useValue: {} },
      { provide: AdminSnackbarService, useValue: { showMessage: vi.fn() } },
      { provide: AdminSseService, useValue: {} },
      { provide: CatalogService, useValue: { loadDraftFeatureSource } },
    ],
  });
  return {
    service: TestBed.inject(FeatureSourceService),
    store: TestBed.inject(Store),
    loadDraftFeatureSource,
  };
};

describe('FeatureSourceService', () => {

  test('getDraftFeatureTypeByName$ emits updated feature type after settings change', () => {
    const featureType = getFeatureType({ id: '2', name: 'table2', settings: { editableAttributes: [] } });
    const { service, store, loadDraftFeatureSource } = setup({
      draftFeatureSourceId: '1',
      draftFeatureSource: getFeatureSource({ id: '1', featureTypes: [ getFeatureType(), featureType ] }),
      draftFeatureSourceLoadStatus: LoadingStateEnum.LOADED,
    });
    const emitted: Array<FeatureTypeModel | null> = [];
    const subscription = service.getDraftFeatureTypeByName$('table2', '1').subscribe(ft => emitted.push(ft));
    expect(loadDraftFeatureSource).not.toHaveBeenCalled();
    expect(emitted).toEqual([featureType]);

    const updatedFeatureType = { ...featureType, settings: { editableAttributes: ['attr1'] } };
    store.dispatch(updateFeatureType({ featureType: updatedFeatureType }));
    expect(emitted).toEqual([ featureType, updatedFeatureType ]);
    subscription.unsubscribe();
  });

  test('getDraftFeatureTypeByName$ loads draft feature source when another one is loaded', () => {
    const { service, loadDraftFeatureSource } = setup({
      draftFeatureSourceId: '5',
      draftFeatureSource: getFeatureSource({ id: '5' }),
      draftFeatureSourceLoadStatus: LoadingStateEnum.LOADED,
    });
    const emitted: Array<FeatureTypeModel | null> = [];
    const subscription = service.getDraftFeatureTypeByName$('table1', '1').subscribe(ft => emitted.push(ft));
    expect(loadDraftFeatureSource).toHaveBeenCalledWith('1');
    expect(emitted).toEqual([]);
    subscription.unsubscribe();
  });

  test('getDraftFeatureType$ does not emit from a previously loaded draft feature source with another id', () => {
    const featureType = getFeatureType({ id: '7', name: 'table7' });
    const { service, store, loadDraftFeatureSource } = setup({
      draftFeatureSourceId: '5',
      draftFeatureSource: getFeatureSource({ id: '5', featureTypes: [getFeatureType()] }),
      draftFeatureSourceLoadStatus: LoadingStateEnum.LOADED,
    });
    const emitted: Array<FeatureTypeModel | null> = [];
    const subscription = service.getDraftFeatureType$('7', '1').subscribe(ft => emitted.push(ft));
    expect(loadDraftFeatureSource).toHaveBeenCalledWith('1');
    expect(emitted).toEqual([]);
    store.dispatch(loadDraftFeatureSourceSuccess({ featureSource: getFeatureSource({ id: '1', featureTypes: [featureType] }) }));
    expect(emitted).toEqual([featureType]);
    subscription.unsubscribe();
  });

  test('getDraftFeatureTypeByName$ emits null when loading failed', () => {
    const { service } = setup({
      draftFeatureSourceId: '1',
      draftFeatureSourceLoadStatus: LoadingStateEnum.FAILED,
    });
    const emitted: Array<FeatureTypeModel | null> = [];
    const subscription = service.getDraftFeatureTypeByName$('table1', '1').subscribe(ft => emitted.push(ft));
    expect(emitted).toEqual([null]);
    subscription.unsubscribe();
  });

});
