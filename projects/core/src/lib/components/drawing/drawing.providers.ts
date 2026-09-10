import { EnvironmentProviders, Provider } from '@angular/core';
import { provideState } from '@ngrx/store';
import { drawingReducer } from './state/drawing.reducer';
import { drawingStateKey } from './state';

export function provideDrawing(): Array<Provider | EnvironmentProviders> {
  return [
    provideState(drawingStateKey, drawingReducer),
  ];
}
