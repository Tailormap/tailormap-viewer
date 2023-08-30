import { TestBed } from '@angular/core/testing';
import { FilterService } from './filter.service';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { selectCQLFilters } from '../state/filter.selectors';
import { take, toArray } from 'rxjs';

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

    const assertEqualMaps = (actual: Map<string, string | null>, expected: Map<string, string | null>) => {
      expect(actual.size).toEqual(expected.size);
      Array.from(actual.keys())
        .forEach((key) => expect(actual.get(key)).toEqual(expected.get(key)));
    };

    // List of state updates where we add, modify and remove filters
    const stateUpdates = [
      new Map([[ '1', 'some_filter' ]]),
      new Map([[ '1', 'some_filter' ], [ '2', 'extra_filter' ]]),
      new Map([[ '1', 'some_filter' ], [ '2', 'changed_filter' ]]),
      new Map([[ '2', 'changed_filter' ]]),
    ];

    // List of expected changed filters based on the state updates
    const expectedValues = [
      new Map([[ '1', 'some_filter' ]]),
      new Map([[ '2', 'extra_filter' ]]),
      new Map([[ '2', 'changed_filter' ]]),
      new Map([[ '1', null ]]),
    ];

    service.getChangedFilters$()
      .pipe(take(stateUpdates.length), toArray())
      .subscribe((actualValues) => {
        actualValues.forEach((actualValue, index) => {
          assertEqualMaps(actualValue, expectedValues[index]);
        });
        done();
      });

    stateUpdates.forEach((stateUpdate) => {
      store.overrideSelector(selectCQLFilters, stateUpdate);
      store.refreshState();
    });

  });

});
