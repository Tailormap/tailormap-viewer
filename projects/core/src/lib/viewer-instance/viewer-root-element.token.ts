import { InjectionToken } from '@angular/core';

/**
 * The DOM element that a viewer instance should treat as its own root when it needs to touch the DOM
 * outside of its component tree (e.g. toggling a CSS class or setting a CSS custom property that other,
 * unrelated elements in that same viewer need to read).
 *
 * Defaults to `document.body`: correct for the main, single-viewer `ViewerAppComponent`, since there is
 * only ever one viewer on the page. A `StoriesViewerAppComponent` — mounted as its own Angular
 * application via `mountStoriesViewer` — overrides this to its own `hostElement`, so multiple viewer
 * instances on one page never clobber each other's state through the shared `document.body`/`:root`.
 */
export const VIEWER_ROOT_ELEMENT = new InjectionToken<HTMLElement>('VIEWER_ROOT_ELEMENT', {
  providedIn: 'root',
  factory: () => document.body,
});
