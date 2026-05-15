import { TestBed } from '@angular/core/testing';
import { FilterService } from './filter.service';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { selectCQLFilters } from '../../state/filter-state/filter.selectors';
import { take, toArray } from 'rxjs';
import { LayerFeaturesFilters } from '../models/feature-filter.model';
import { FeaturesFilterHelper } from '../helpers/features-filter.helper';

describe('FilterService', () => {

  test('gets changed filters', (done) => {
    TestBed.configureTestingModule({
      providers: [
        FilterService,
        provideMockStore({
          initialState: {},
          selectors: [{ selector: selectCQLFilters, value: new Map() }],
        }),
      ],
    });
    const service = TestBed.inject(FilterService);
    const store = TestBed.inject(MockStore);

    const assertEqualMaps = (actual: LayerFeaturesFilters | null | undefined, expected: LayerFeaturesFilters | null | undefined) => {
      if (actual === undefined || expected === undefined || actual === null || expected === null) {
        expect(actual).toEqual(expected);
        return;
      }
      expect(actual.size).toEqual(expected.size);
      Array.from(actual.keys())
        .forEach((key) => expect(actual.get(key)).toEqual(expected.get(key)));
    };

    const assertEqualFilterMaps = (actual: Map<string, LayerFeaturesFilters | null>, expected: Map<string, LayerFeaturesFilters | null>) => {
      expect(actual.size).toEqual(expected.size);
      Array.from(actual.keys())
        .forEach((key) => {
          const actualFilter = actual.get(key);
          const expectedFilter = expected.get(key);
          assertEqualMaps(actualFilter, expectedFilter);
        });
    };

    // List of state updates where we add, modify and remove filters
    const stateUpdates: Map<string, LayerFeaturesFilters>[] = [
      new Map([[ '1', new Map([[ FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME, 'some_filter' ]]) ]]),
      new Map(
        [
          [ '1', new Map([[ FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME, 'some_filter' ]]) ],
          [ '2', new Map([[ FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME, 'extra_filter' ]]) ],
      ]),
      new Map([
        [ '1', new Map([[ FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME, 'some_filter' ]]) ],
        [ '2', new Map([[ FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME, 'changed_filter' ]]) ],
      ]),
      new Map([[ '2', new Map([[ FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME, 'changed_filter' ]]) ]]),
    ];

    // List of expected changed filters based on the state updates
    const expectedValues = [
      new Map([[ '1', new Map([[ FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME, 'some_filter' ]]) ]]),
      new Map([[ '2', new Map([[ FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME, 'extra_filter' ]]) ]]),
      new Map([[ '2', new Map([[ FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME, 'changed_filter' ]]) ]]),
      new Map([[ '1', null ]]),
    ];

    service.getChangedFilters$()
      .pipe(take(stateUpdates.length), toArray())
      .subscribe((actualValues) => {
        actualValues.forEach((actualValue, index) => {
          assertEqualFilterMaps(actualValue, expectedValues[index]);
        });
        done();
      });

    stateUpdates.forEach((stateUpdate) => {
      store.overrideSelector(selectCQLFilters, stateUpdate);
      store.refreshState();
    });

  });

});
