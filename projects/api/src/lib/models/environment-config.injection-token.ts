import { InjectionToken } from '@angular/core';
import { EnvironmentConfigModel } from './environment-config.model';

export const ENVIRONMENT_CONFIG = new InjectionToken<EnvironmentConfigModel>('EnvironmentConfigModel');
