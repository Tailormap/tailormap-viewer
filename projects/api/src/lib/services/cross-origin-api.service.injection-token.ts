import { InjectionToken } from '@angular/core';
import { CrossOriginApiServiceModel } from './cross-origin-api.service.model';

export const TAILORMAP_CROSS_ORIGIN_API_SERVICE = new InjectionToken<CrossOriginApiServiceModel>('TailormapCrossOriginApiService');
