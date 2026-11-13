import { InjectionToken } from '@angular/core';

/**
 * Whether the map requires ctrl/cmd + scroll to zoom and two fingers to pan, showing a hint overlay otherwise.
 * Defaults to true when the viewer runs inside an iframe. Provide it on a parent component to override it for all maps below.
 */
export const MAP_COOPERATIVE_GESTURES = new InjectionToken<boolean>('MAP_COOPERATIVE_GESTURES', {
  factory: () => {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      return window.self !== window.top;
    } catch {
      // Cross-origin iframe access can throw; assume embedded.
      return true;
    }
  },
});
