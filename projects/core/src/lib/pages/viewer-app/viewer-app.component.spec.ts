import { render } from '@testing-library/angular';
import { Injector } from '@angular/core';
import { ViewerAppComponent } from './viewer-app.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ActivatedRoute } from '@angular/router';
import { lastValueFrom, of } from 'rxjs';
import { Store } from '@ngrx/store';

export const getActivatedRouteProvider = (routeData: Record<string, string>) => {
  return { provide: ActivatedRoute, useValue: {
      // eslint-disable-next-line rxjs/finnish
      paramMap: of(new Map<string, string>(Object.entries(routeData))),
    }};
};

describe('ViewerAppComponent', () => {

  test('should render', async () => {
    const dispatchFn = jest.fn();
    const mockStore = {
      dispatch: dispatchFn,
    };
    const { container } = await render(ViewerAppComponent, {
      componentProviders: [
        { provide: Store, useValue: mockStore },
        getActivatedRouteProvider({ id: '1' }),
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    });
    expect(container.querySelector('tm-map')).not.toBeNull();
    expect(dispatchFn).toHaveBeenCalledWith({ type: '[Core] Load Application', id: 1 });
  });

});
