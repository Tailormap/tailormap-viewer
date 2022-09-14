import { InjectionToken } from '@angular/core';
import { TailormapApiV1ServiceModel } from './tailormap-api-v1.service.model';

export const TAILORMAP_API_V1_SERVICE = new InjectionToken<TailormapApiV1ServiceModel>('TailormapApiV1Service');
