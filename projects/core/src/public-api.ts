/*
 * Public API Surface of core
 */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./typings.d.ts" />

if (typeof window.$localize === 'undefined') {
  window.$localize = (messageParts: TemplateStringsArray) => messageParts.join('');
}

export * from './lib/core.providers';
export * from './lib/pages';
export * from './lib/components';
export * from './lib/components/drawing/drawing.providers';
export * from './lib/components/attribute-list/attribute-list.providers';
export * from './lib/components/feature-info/feature-info.providers';
export * from './lib/components/edit/edit.providers';
export * from './lib/components/filter/filter-component.providers';
export * from './lib/shared';
export * from './lib/state';
export * from './lib/services';
export * from './lib/services/user-login-check.service';
export * from './lib/services/load-viewer.service';
export * from './lib/services/viewer-layout/mobile-layout.service';
export * from './lib/layout/layout.service';
export * from './lib/layout/base-layout/base-layout.component';
export * from './lib/layout/mobile-layout/mobile-layout.component';
export * from './lib/layout/embedded-layout/embedded-layout.component';
export * from './lib/map';
export * from './lib/filter';
export * from './lib/models';
export * from './lib/viewer-instance/viewer-route-sync.token';
export * from './lib/viewer-instance/viewer-root-element.token';
export * from './lib/viewer-instance/provider.helper';
