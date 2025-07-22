import { CoreEffects } from './core.effects';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';
import { LoadViewerService } from '../services/load-viewer.service';
import { AttributeFilterModel, FilterGroupModel, getViewerResponseData } from '@tailormap-viewer/api';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import * as CoreActions from './core.actions';
import { AttributeFilterService } from '../services/attribute-filter.service';

describe('CoreEffects', () => {

  const setup = (currentPath: string, actions$: Observable<any>): [ CoreEffects, jest.Mock ] => {
    const loadViewerServiceMock = {
      loadViewer$: () => of({ success: true, result: { viewer: getViewerResponseData(), components: [] } }),
    };
    const attributeFilterServiceMock = {
      disableFiltersForMissingAttributes$: (filterGroups: FilterGroupModel<AttributeFilterModel>[]) => of(filterGroups),
    };
    const locationMock = {
      path: () => currentPath,
    };
    const navigateMock = jest.fn();
    const routerMock = {
      navigate: navigateMock,
    };
    TestBed.configureTestingModule({
      providers: [
        CoreEffects,
        provideMockActions(() => actions$),
        { provide: LoadViewerService, useValue: loadViewerServiceMock },
        { provide: Location, useValue: locationMock },
        { provide: Router, useValue: routerMock },
        { provide: AttributeFilterService, useValue: attributeFilterServiceMock },
      ],
    });
    const effects = TestBed.inject(CoreEffects);
    return [ effects, navigateMock ];
  };

  const getLoadViewerSuccessAction = (id: string): Observable<any> => {
    return of(CoreActions.loadViewerSuccess({ viewer: getViewerResponseData({ id }) }));
  };

  it('should redirect url is empty', () => {
    const [ effects, navigateMock ] = setup('/', getLoadViewerSuccessAction('app/test'));
    effects.updateUrlAfterViewerLoad$.subscribe();
    expect(navigateMock).toHaveBeenCalledWith([ 'app', 'test' ], { preserveFragment: true, skipLocationChange: true });
  });

  it('should redirect url if the current app name does not match the loaded app', () => {
    const [ effects, navigateMock ] = setup('/app/does-not-match', getLoadViewerSuccessAction('app/some name'));
    effects.updateUrlAfterViewerLoad$.subscribe();
    expect(navigateMock).toHaveBeenCalledWith([ 'app', 'some+name' ], { preserveFragment: true, skipLocationChange: true });
  });

  it('should not redirect url if application name is in URL already', () => {
    const [ effects, navigateMock ] = setup('/app/test', getLoadViewerSuccessAction('app/test'));
    effects.updateUrlAfterViewerLoad$.subscribe();
    expect(navigateMock).not.toHaveBeenCalled();
  });

});
