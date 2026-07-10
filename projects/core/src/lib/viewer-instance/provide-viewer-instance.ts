import { EnvironmentProviders, Provider } from '@angular/core';
import { provideStore, provideState } from '@ngrx/store';
import { MapService } from '@tailormap-viewer/map';
import { coreStateKey } from '../state/core.state';
import { coreReducer } from '../state/core.reducer';
// Feature state slices. These are registered with the standalone `provideState` API here (rather than
// `StoreModule.forFeature` in the feature modules) because the viewer store lives in a route/child
// environment injector, where the NgModule `StoreModule` API does not work.
import { mapStateKey } from '../map/state/map.state';
import { mapReducer } from '../map/state/map.reducer';
import { featureInfoStateKey } from '../components/feature-info/state/feature-info.state';
import { featureInfoReducer } from '../components/feature-info/state/feature-info.reducer';
import { drawingStateKey } from '../components/drawing/state/drawing.state';
import { drawingReducer } from '../components/drawing/state/drawing.reducer';
import { attributeListStateKey } from '../components/attribute-list/state/attribute-list.state';
import { attributeListReducer } from '../components/attribute-list/state/attribute-list.reducer';
import { tocStateKey } from '../components/toc/state/toc.state';
import { tocReducer } from '../components/toc/state/toc.reducer';
import { editStateKey } from '../components/edit/state/edit.state';
import { editReducer } from '../components/edit/state/edit.reducer';
import { filterComponentStateKey } from '../components/filter/state/filter-component.state';
import { filterComponentReducer } from '../components/filter/state/filter-component.reducer';
// Viewer-scoped services (group A).
import { ApplicationMapService } from '../map/services/application-map.service';
import { ApplicationLayerService } from '../map/services/application-layer.service';
import { ApplicationLayerRefreshService } from '../map/services/application-layer-refresh.service';
import { LoadViewerService } from '../services/load-viewer.service';
import { LoadMapService } from '../map/services/load-map.service';
import { LoadGeometriesService } from '../services/load-geometries.service';
import { FeatureUpdatedService } from '../services/feature-updated.service';
import { AttachmentService } from '../services/attachment.service';
import { MapPdfService } from '../services/map-pdf/map-pdf.service';
import { ViewerLayoutService } from '../services/viewer-layout/viewer-layout.service';
import { MobileLayoutService } from '../services/viewer-layout/mobile-layout.service';
import { LayoutService } from '../layout/layout.service';
import { FeatureInfoService } from '../components/feature-info/feature-info.service';
import { LegendService } from '../components/legend/services/legend.service';
import { DrawingFeatureRegistrationService } from '../components/drawing/services/drawing-feature-registration.service';
import { DrawingLegendPrintService } from '../components/drawing/services/drawing-legend-print-service';
import { AttributeListStateService } from '../components/attribute-list/services/attribute-list-state.service';
import { AttributeListManagerService } from '../components/attribute-list/services/attribute-list-manager.service';
import { AttributeListDataService } from '../components/attribute-list/services/attribute-list-data.service';
import { AttributeListApiService } from '../components/attribute-list/services/attribute-list-api.service';
import { AttributeListExportService } from '../components/attribute-list/services/attribute-list-export.service';
import { AttributeListStatisticsService } from '../components/attribute-list/services/attribute-list-statistics.service';
import { AttributeListFeatureDetailsService } from '../components/attribute-list/services/attribute-list-feature-details.service';
import { AttributeListFeatureRegistrationService } from '../components/attribute-list/services/attribute-list-feature-registration.service';
import { TocFeatureRegistrationService } from '../components/toc/services/toc-feature-registration.service';
import { MenubarService } from '../components/menubar/menubar.service';
import { SimpleSearchService } from '../components/toolbar/simple-search/simple-search.service';
import { SnappingService } from '../components/toolbar/snapping/snapping.service';
import { PrintService } from '../components/print/print.service';
import { EditFeatureService } from '../components/edit/services/edit-feature.service';
import { EditMapToolService } from '../components/edit/services/edit-map-tool.service';
import { ReferenceLayerService } from '../components/filter/services/reference-layer.service';
import { RemoveFilterService } from '../components/filter/services/remove-filter.service';
import { SpatialFilterCrudService } from '../components/filter/services/spatial-filter-crud.service';
import { FilterService } from '../filter/services/filter.service';
import { FilterManagerService } from '../filter/services/filter-manager.service';
import { FilterApiService } from '../filter/services/filter-api.service';
import { SimpleAttributeFilterService } from '../filter/services/simple-attribute-filter.service';
import { SpatialFilterReferenceLayerService } from '../filter/services/spatial-filter-reference-layer.service';
// Global-browser-integration services (group B) — only the top-level ViewerAppComponent needs these.
import { ApplicationBookmarkService } from '../services/application-bookmark/application-bookmark.service';
import { FeatureSelectionBookmarkService } from '../services/application-bookmark/feature-selection-bookmark.service';
import {
  ReadableVisibilityBookmarkHandlerService,
} from '../services/application-bookmark/bookmark-fragment-handlers/readable-visibility-bookmark-handler.service';
import { BookmarkService } from '../services/bookmark/bookmark.service';
import { ApplicationStyleService } from '../services/application-style.service';

/**
 * Runtime checks used for every viewer store — identical to what `CoreModule.forRoot` configured when
 * the store still lived at the application root.
 */
const viewerStoreRuntimeChecks = {
  strictActionImmutability: true,
  strictActionSerializability: true,
  strictActionWithinNgZone: true,
  strictStateImmutability: true,
  strictStateSerializability: true,
  strictActionTypeUniqueness: true,
};

/**
 * The NgRx **root store** for a single viewer instance (no feature slices). Split out so the store
 * isolation can be exercised on its own.
 *
 * Uses the **standalone** `provideStore` API. The viewer store lives in a route/child environment
 * injector (route `providers` / `createEnvironmentInjector`), where the NgModule `StoreModule.forRoot`
 * API does NOT work (each ends up in its own sub-injector). NgRx Effects additionally cannot run in a
 * child environment injector at all (the effects runner requires an application-root injector — see
 * `provide-viewer-instance.spec.ts`), which is why every former `*.effects.ts` class in this app has
 * been converted to a plain, `providedIn: 'root'` service instead: the service dispatches the
 * "trigger" action itself, does the async work, and dispatches the success/failure action(s), rather
 * than a separate `Actions`/`ofType` pipeline reacting to a dispatched action.
 */
export function getViewerRootStoreProviders(): EnvironmentProviders {
  return provideStore({ [coreStateKey]: coreReducer }, { runtimeChecks: viewerStoreRuntimeChecks });
}

/**
 * The `provideState()` registration for every feature slice used by a viewer. Pulled out of
 * {@link getViewerStoreProviders} so the single-application main viewer (`CoreModule`, which still
 * provides its **root** store via `StoreModule.forRoot`) can add these too: `StoreModule.forFeature`
 * (used by the feature NgModules `FeatureInfoModule`, `AttributeListModule`, `DrawingModule`,
 * `TocModule`, `EditComponentModule`, `FilterComponentModule`, `ApplicationMapModule`) requires a
 * `StoreRootModule` instance, which only `StoreModule.forRoot` provides — not the standalone
 * `provideStore()` used by the per-viewer application root in {@link mountStoriesViewer}. So those
 * feature modules no longer call `forFeature`; this function is the single place every feature slice is
 * registered, for both the main app and every stories viewer.
 */
export function getViewerFeatureStateProviders(): Array<Provider | EnvironmentProviders> {
  return [
    provideState(mapStateKey, mapReducer),
    provideState(featureInfoStateKey, featureInfoReducer),
    provideState(drawingStateKey, drawingReducer),
    provideState(attributeListStateKey, attributeListReducer),
    provideState(tocStateKey, tocReducer),
    provideState(editStateKey, editReducer),
    provideState(filterComponentStateKey, filterComponentReducer),
  ];
}

/**
 * The complete NgRx store for a single viewer instance: the root store and every feature slice. In the
 * "one store per viewer" architecture the store is no longer provided at the application root — each
 * viewer instance owns its complete store.
 */
export function getViewerStoreProviders(): Array<Provider | EnvironmentProviders> {
  return [
    getViewerRootStoreProviders(),
    ...getViewerFeatureStateProviders(),
  ];
}

/**
 * The viewer-scoped services that are declared `providedIn: 'root'` but must resolve **per viewer
 * instance** so each viewer gets its own map/state services instead of a shared global singleton.
 * Listing a class here forces the viewer's environment injector to create its own instance without
 * editing the individual service file.
 *
 * This is the "group A" (base) set — needed by every viewer, including {@link StoriesViewerAppComponent}.
 * See VIEWER_INSTANCE_SERVICES.md for the full inventory and rationale.
 */
export const VIEWER_INSTANCE_SERVICES: Provider[] = [
  MapService,
  // map slice
  ApplicationMapService,
  ApplicationLayerService,
  ApplicationLayerRefreshService,
  LoadMapService,
  // core viewer services
  LoadViewerService,
  LoadGeometriesService,
  FeatureUpdatedService,
  AttachmentService,
  MapPdfService,
  ViewerLayoutService,
  MobileLayoutService,
  LayoutService,
  // feature components
  FeatureInfoService,
  LegendService,
  DrawingFeatureRegistrationService,
  DrawingLegendPrintService,
  AttributeListStateService,
  AttributeListManagerService,
  AttributeListDataService,
  AttributeListApiService,
  AttributeListExportService,
  AttributeListStatisticsService,
  AttributeListFeatureDetailsService,
  AttributeListFeatureRegistrationService,
  TocFeatureRegistrationService,
  MenubarService,
  SimpleSearchService,
  SnappingService,
  PrintService,
  EditFeatureService,
  EditMapToolService,
  ReferenceLayerService,
  RemoveFilterService,
  SpatialFilterCrudService,
  // filter library services
  FilterService,
  FilterManagerService,
  FilterApiService,
  SimpleAttributeFilterService,
  SpatialFilterReferenceLayerService,
];

/**
 * Global-browser-integration services (group B): URL/bookmark, feature-selection messaging and global
 * styling. Only the top-level {@link ViewerAppComponent} adds these; {@link StoriesViewerAppComponent}
 * deliberately omits them so embedded viewers never touch the URL or global CSS.
 */
export const GROUP_B_VIEWER_SERVICES: Provider[] = [
  ApplicationBookmarkService,
  FeatureSelectionBookmarkService,
  ReadableVisibilityBookmarkHandlerService,
  BookmarkService,
  ApplicationStyleService,
];

export interface ViewerInstanceProvidersOptions {
  /**
   * Extra per-instance providers, e.g. {@link GROUP_B_VIEWER_SERVICES} for the top-level
   * `ViewerAppComponent`.
   */
  extraProviders?: Array<Provider | EnvironmentProviders>;
}

/**
 * Everything a single, isolated viewer instance needs in its own `EnvironmentInjector`: its own store
 * + feature slices and its own copies of the viewer-scoped services.
 */
export function getViewerInstanceProviders(options: ViewerInstanceProvidersOptions = {}): Array<Provider | EnvironmentProviders> {
  return [
    ...getViewerStoreProviders(),
    ...VIEWER_INSTANCE_SERVICES,
    ...(options.extraProviders ?? []),
  ];
}

/**
 * Convenience for the top-level, routed viewer: the full instance providers plus the
 * global-browser-integration services.
 */
export function getViewerAppInstanceProviders(): Array<Provider | EnvironmentProviders> {
  return getViewerInstanceProviders({ extraProviders: GROUP_B_VIEWER_SERVICES });
}
