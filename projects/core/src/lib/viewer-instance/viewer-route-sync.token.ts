import { InjectionToken } from '@angular/core';

/**
 * Whether `LoadViewerService` should sync the loaded viewer into the browser URL via `Router`.
 * Defaults to `true` (the main, single-viewer `ViewerAppComponent`, which runs under `CoreModule`'s
 * `RouterModule.forRoot`/`forChild` with real routes configured).
 *
 * An isolated viewer instance (stories) must opt out: since Angular 20's `Router` is `providedIn:
 * 'root'`, it auto-instantiates in *every* environment/application root — including a `createApplication`
 * root that never configured any routes — with an empty `config: []`. `Router.navigate(...)` against
 * that empty config always throws `NG04002: Cannot match any routes`, so route sync must be disabled
 * rather than relying on injection failing.
 *
 * Lives in its own file (rather than `provide-viewer-instance.ts`) to avoid a circular import:
 * `provide-viewer-instance.ts` references `LoadViewerService`, and `LoadViewerService` needs this token.
 */
export const VIEWER_ROUTE_SYNC_ENABLED = new InjectionToken<boolean>('VIEWER_ROUTE_SYNC_ENABLED', {
  providedIn: 'root',
  factory: () => true,
});
