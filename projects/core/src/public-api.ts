/*
 * Public API Surface of core
 */
/// <reference path="typings.d.ts" />

if (typeof window.$localize === 'undefined') {
  window.$localize = (messageParts: TemplateStringsArray) => messageParts.join('');
}

export * from './lib/core.module';
export * from './lib/core-routing.module';
export * from './lib/pages';
export * from './lib/components';
export * from './lib/bookmark/bookmark.actions';
export * from './lib/bookmark/bookmark.selectors';
export * from './lib/bookmark/bookmark.model';
