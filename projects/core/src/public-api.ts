/*
 * Public API Surface of core
 */
import "./typings.d.ts";

if (typeof window.$localize === 'undefined') {
  window.$localize = (messageParts: TemplateStringsArray) => messageParts.join('');
}

export * from './lib/core.module';
export * from './lib/core-routing.module';
export * from './lib/pages';
export * from './lib/components';
