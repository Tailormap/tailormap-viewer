import { coreStateKey } from '../state';
import { coreReducer } from '../state/core.reducer';
import { mapStateKey } from '../map/state/map.state';
import { mapReducer } from '../map/state/map.reducer';
import { attributeListStateKey } from '../components/attribute-list/state/attribute-list.state';
import { attributeListReducer } from '../components/attribute-list/state/attribute-list.reducer';
import { drawingStateKey } from '../components/drawing/state/drawing.state';
import { drawingReducer } from '../components/drawing/state/drawing.reducer';
import { editStateKey } from '../components/edit/state/edit.state';
import { editReducer } from '../components/edit/state/edit.reducer';
import { featureInfoStateKey } from '../components/feature-info/state/feature-info.state';
import { featureInfoReducer } from '../components/feature-info/state/feature-info.reducer';
import { filterComponentStateKey } from '../components/filter/state/filter-component.state';
import { filterComponentReducer } from '../components/filter/state/filter-component.reducer';
import { tocStateKey } from '../components/toc/state/toc.state';
import { tocReducer } from '../components/toc/state/toc.reducer';

/**
 * Since the standalone-components migration, rendering a "shell" component (BaseLayoutComponent
 * and anything that includes it, such as MobileLayoutComponent/EmbeddedLayoutComponent) actually
 * instantiates all of its ~20 real child components instead of leaving them as opaque, unresolved
 * elements under CUSTOM_ELEMENTS_SCHEMA. Those children read from every NgRx feature slice the app
 * registers, so `provideMockStore({ initialState: {} })` leaves most of the state tree `undefined`
 * and selectors throw (e.g. "Cannot read properties of undefined (reading 'layers')").
 *
 * This runs every feature reducer with an init action to get its real default state, so a shell
 * test only needs to override the specific selectors it cares about via `selectors: [...]`.
 */
export const getFullInitialAppState = () => {
  const init = { type: '@ngrx/store/init' };
  return {
    [coreStateKey]: coreReducer(undefined, init),
    [mapStateKey]: mapReducer(undefined, init),
    [attributeListStateKey]: attributeListReducer(undefined, init),
    [drawingStateKey]: drawingReducer(undefined, init),
    [editStateKey]: editReducer(undefined, init),
    [featureInfoStateKey]: featureInfoReducer(undefined, init),
    [filterComponentStateKey]: filterComponentReducer(undefined, init),
    [tocStateKey]: tocReducer(undefined, init),
  };
};
