/*
 * Public API Surface of admin-core
 */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./typings.d.ts" />

export * from './lib/admin-core.module';
export * from './lib/admin-core-routing.module';
export * from './lib/settings/services/admin-settings-router.service';
export * from './lib/config/services/config.service';
export * from './lib/application/services/configuration-component-registry.service';
export * from './lib/application/components/base-component-config/base-component-config.component';
export * from './lib/shared/services/admin-field-registration.service';
export * from './lib/shared/services/admin-snackbar.service';
export * from './lib/shared/components';
export * from './lib/helpers/form.helper';
