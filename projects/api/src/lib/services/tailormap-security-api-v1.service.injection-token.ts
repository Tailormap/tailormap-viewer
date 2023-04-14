import { InjectionToken } from '@angular/core';
import { TailormapSecurityApiV1ServiceModel } from './tailormap-security-api-v1.service.model';

export const TAILORMAP_SECURITY_API_V1_SERVICE = new InjectionToken<TailormapSecurityApiV1ServiceModel>('TailormapSecurityApiV1Service');
