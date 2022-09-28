import { Actions } from '@ngrx/effects';
import { CoreEffects } from './core.effects';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';
import { LoadApplicationService } from '../services/load-application.service';
import { getAppResponseData } from '@tailormap-viewer/api';
import { Location } from '@angular/common';
import * as CoreActions from './core.actions';

describe('CoreEffects', () => {

  const setup = (currentPath: string, actions$: Observable<Actions>) => {
    const getActions: () => Observable<Actions> = () => of({});
    const loadApplicationServiceMock = {
      loadApplication$: () => of({ success: true, result: { application: getAppResponseData(), components: [] } }),
    };
    const replaceStateMock = jest.fn();
    const locationMock = {
      path: () => currentPath,
      replaceState: replaceStateMock,
    };
    TestBed.configureTestingModule({
      providers: [
        CoreEffects,
        provideMockActions(() => actions$),
        { provide: LoadApplicationService, useValue: loadApplicationServiceMock },
        { provide: Location, useValue: locationMock },
      ],
    });
    const effects = TestBed.inject(CoreEffects);
    return [ effects, replaceStateMock, getActions ];
  };

  const getLoadApplicationSuccessAction = (name: string): Observable<Actions> => {
    return of(CoreActions.loadApplicationSuccess({ application: getAppResponseData({ name }), components: [] }));
  };

  it('should redirect url is empty', () => {
    const [ effects, replaceStateMock ] = setup('/', getLoadApplicationSuccessAction('test'));
    effects.updateUrlAfterApplicationLoad$.subscribe();
    expect(replaceStateMock).toHaveBeenCalledWith('/app/test');
  });

  it('should redirect url is the current app name does not match the loaded app', () => {
    const [ effects, replaceStateMock ] = setup('/app/does-not-match', getLoadApplicationSuccessAction('some name'));
    effects.updateUrlAfterApplicationLoad$.subscribe();
    expect(replaceStateMock).toHaveBeenCalledWith('/app/some+name');
  });

  it('should not redirect url if application name is in URL already', () => {
    const [ effects, replaceStateMock ] = setup('/app/test', getLoadApplicationSuccessAction('test'));
    effects.updateUrlAfterApplicationLoad$.subscribe();
    expect(replaceStateMock).not.toHaveBeenCalled();
  });

  it('should not redirect url if url is not an empty or app/* url', () => {
    const [ effects, replaceStateMock ] = setup('/login', getLoadApplicationSuccessAction('test'));
    effects.updateUrlAfterApplicationLoad$.subscribe();
    expect(replaceStateMock).not.toHaveBeenCalled();
  });

});
