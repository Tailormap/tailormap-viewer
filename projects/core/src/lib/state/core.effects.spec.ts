import { CoreEffects } from './core.effects';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';
import { LoadViewerService } from '../services/load-viewer.service';
import { getViewerResponseData } from '@tailormap-viewer/api';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import * as CoreActions from './core.actions';

describe('CoreEffects', () => {

  const setup = (currentPath: string, actions$: Observable<any>): [ CoreEffects, jest.Mock ] => {
    const loadApplicationServiceMock = {
      loadApplication$: () => of({ success: true, result: { application: getViewerResponseData(), components: [] } }),
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
        { provide: LoadViewerService, useValue: loadApplicationServiceMock },
        { provide: Location, useValue: locationMock },
        { provide: Router, useValue: routerMock },
      ],
    });
    const effects = TestBed.inject(CoreEffects);
    return [ effects, navigateMock ];
  };

  const getLoadApplicationSuccessAction = (name: string): Observable<any> => {
    return of(CoreActions.loadViewerSuccess({ application: getViewerResponseData({ name }), components: [] }));
  };

  it('should redirect url is empty', () => {
    const [ effects, navigateMock ] = setup('/', getLoadApplicationSuccessAction('test'));
    effects.updateUrlAfterApplicationLoad$.subscribe();
    expect(navigateMock).toHaveBeenCalledWith([ 'app', 'test' ], { preserveFragment: true, skipLocationChange: true });
  });

  it('should redirect url is the current app name does not match the loaded app', () => {
    const [ effects, navigateMock ] = setup('/app/does-not-match', getLoadApplicationSuccessAction('some name'));
    effects.updateUrlAfterApplicationLoad$.subscribe();
    expect(navigateMock).toHaveBeenCalledWith([ 'app', 'some+name' ], { preserveFragment: true, skipLocationChange: true });
  });

  it('should not redirect url if application name is in URL already', () => {
    const [ effects, navigateMock ] = setup('/app/test', getLoadApplicationSuccessAction('test'));
    effects.updateUrlAfterApplicationLoad$.subscribe();
    expect(navigateMock).not.toHaveBeenCalled();
  });

});
