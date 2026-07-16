import { provideStore } from '@ngrx/store';
import { coreStateKey } from '../state';
import { coreReducer } from '../state/core.reducer';
import { mapStateKey } from '../map/state/map.state';
import { mapReducer } from '../map/state/map.reducer';

export class StoreInstanceProviderHelper {
  public static getStoreProvider() {
    return provideStore({
      [coreStateKey]: coreReducer,
      [mapStateKey]: mapReducer,
    }, {
      runtimeChecks: {
        strictActionImmutability: true,
        strictActionSerializability: true,
        strictActionWithinNgZone: true,
        strictStateImmutability: true,
        strictStateSerializability: true,
        strictActionTypeUniqueness: true,
      },
    });
  }
}
