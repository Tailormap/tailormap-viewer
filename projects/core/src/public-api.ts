/*
 * Public API Surface of core
 */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./typings.d.ts" />

if (typeof window.$localize === 'undefined') {
  window.$localize = (messageParts: TemplateStringsArray) => messageParts.join('');
}

export * from './lib/core.module';
export * from './lib/core-routing.module';
export * from './lib/pages';
export * from './lib/components';
